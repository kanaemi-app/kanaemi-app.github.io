"""Fetch the dictionaries of the latest kanaemi-dict release into
public/dictionaries/, so the site serves them itself, and describe them in
src/data/dictionaries.json for the download table.

What to fetch is read from the release's catalog, index.json, which the
settings app of Kanaemi reads too: the order, the labels, and the SHA-256 of
each dictionary and model. An archive whose files do not match the catalog
stops the build, as the settings app would refuse it.

Without the network, the files fetched before are kept and used. Set
KANAEMI_DICT_RELEASE to the download URL of a release (ending in its tag) to
fetch from somewhere else, such as a release not yet published.
"""
import hashlib
import io
import json
import os
import re
import sys
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

REPOSITORY = "kanaemi-app/kanaemi-dict"
LATEST = f"https://github.com/{REPOSITORY}/releases/latest"
CATALOG_FORMAT = 1
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "dictionaries"
MANIFEST = ROOT / "src" / "data" / "dictionaries.json"
LABEL = re.compile(r"Kanaemi 公式辞書・(?P<label>.+?)（")


def short_label(label, name):
    """The part of the catalog's label that names the dictionary: 鉄道 out of
    "Kanaemi 公式辞書・鉄道（kanaemi-dict）"."""
    found = LABEL.search(label)
    return found.group("label") if found else name


def parse_catalog(data):
    catalog = json.loads(data)
    if catalog.get("format") != CATALOG_FORMAT:
        raise ValueError(f"the catalog is format {catalog.get('format')}; this script reads format {CATALOG_FORMAT}")
    dictionaries = catalog.get("dictionaries") or []
    if not dictionaries:
        raise ValueError("the catalog lists no dictionaries")
    return dictionaries


def member(archive, file):
    return next((m for m in archive.namelist() if m == file or m.endswith(f"/{file}")), None)


def verify(entry, data):
    """Raise unless the archive holds the dictionary, and the model of the base
    dictionary, with the SHA-256 the catalog gives."""
    wanted = [(entry["dictionary"]["file"], entry["dictionary"]["sha256"])]
    if entry.get("model"):
        wanted.append(("ranking.model", entry["model"]["sha256"]))
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        for file, sha256 in wanted:
            name = member(archive, file)
            if name is None:
                raise ValueError(f"{entry['archive']} has no {file}")
            if hashlib.sha256(archive.read(name)).hexdigest() != sha256:
                raise ValueError(f"{file} in {entry['archive']} does not match the catalog")



class NoRelease(Exception):
    """kanaemi-dict has no release with a catalog to fetch."""


def request(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "kanaemi-site"}), timeout=60) as response:
        return response.read(), response.geturl()


def missing(error):
    return isinstance(error, urllib.error.HTTPError) and error.code == 404


def release():
    """The tag, page, download URL and catalog of the release to fetch. A
    release without a catalog counts as no release."""
    try:
        override = os.environ.get("KANAEMI_DICT_RELEASE")
        if override:
            base_url = override.rstrip("/")
            tag, page = base_url.rsplit("/", 1)[-1], base_url
        else:
            # The latest release redirects to its tag; fetch from the tag so
            # that a release published meanwhile cannot mix two versions.
            _, page = request(LATEST)
            tag = page.rstrip("/").rsplit("/", 1)[-1]
            base_url = f"https://github.com/{REPOSITORY}/releases/download/{tag}"
        catalog, _ = request(f"{base_url}/index.json")
    except urllib.error.HTTPError as error:
        if missing(error):
            raise NoRelease() from error
        raise
    return tag, page, base_url, catalog


def from_catalog(base_url, catalog):
    entries = []
    for entry in parse_catalog(catalog):
        path = OUT / entry["archive"]
        try:
            data = path.read_bytes()
            verify(entry, data)
        except (OSError, ValueError, zipfile.BadZipFile):
            data, _ = request(f"{base_url}/{entry['archive']}")
            verify(entry, data)
            path.write_bytes(data)
        entries.append(
            {
                "name": entry["name"],
                "base": bool(entry.get("base")),
                "label": short_label(entry.get("label", ""), entry["name"]),
                "file": entry["archive"],
                "size": len(data),
                "model": bool(entry.get("model")),
            }
        )
    return entries


def fetch():
    OUT.mkdir(parents=True, exist_ok=True)
    try:
        tag, page, base_url, catalog = release()
    except NoRelease:
        tag, page, entries = None, LATEST.rsplit("/", 1)[0], []
    else:
        entries = from_catalog(base_url, catalog)
    current = {e["file"] for e in entries}
    for stale in OUT.glob("*.zip"):
        if stale.name not in current:
            stale.unlink()
    manifest = {"tag": tag, "url": page, "dictionaries": entries}
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    return manifest


def main():
    try:
        manifest = fetch()
    except (OSError, ValueError, zipfile.BadZipFile) as error:
        kept = MANIFEST.exists() and all((OUT / d["file"]).exists() for d in json.loads(MANIFEST.read_text())["dictionaries"])
        # A catalog that does not match its archives is not something to paper over.
        if kept and isinstance(error, OSError):
            print(f"fetch-dictionaries: {error}; keeping the dictionaries fetched before", file=sys.stderr)
            return 0
        print(f"fetch-dictionaries: {error}", file=sys.stderr)
        return 1
    if manifest["tag"] is None:
        print("fetch-dictionaries: kanaemi-dict has no release yet; the site lists no dictionaries")
    else:
        print(f"fetch-dictionaries: {manifest['tag']}, {len(manifest['dictionaries'])} dictionaries")
    return 0


if __name__ == "__main__":
    sys.exit(main())
