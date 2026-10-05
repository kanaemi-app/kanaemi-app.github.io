"""Read the catalog of Kanaemi's latest release, index.json, into
src/data/installers.json, so the site links each installer directly.

The installers stay on GitHub; only the catalog is read. A release without a
catalog counts as no release, and the site then says none is out yet.
Without the network, the catalog read before is kept.
"""
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPOSITORY = "kanaemi-app/kanaemi"
CATALOG = f"https://github.com/{REPOSITORY}/releases/latest/download/index.json"
CATALOG_FORMAT = 1
MANIFEST = Path(__file__).resolve().parents[1] / "src" / "data" / "installers.json"


def parse_catalog(data):
    catalog = json.loads(data)
    if catalog.get("format") != CATALOG_FORMAT:
        raise ValueError(f"the catalog is format {catalog.get('format')}; this script reads format {CATALOG_FORMAT}")
    version = catalog["version"]
    packages = catalog.get("packages") or []
    if not packages:
        raise ValueError("the catalog lists no packages")
    return version, [
        {**p, "url": f"https://github.com/{REPOSITORY}/releases/download/{version}/{p['file']}"} for p in packages
    ]


def main():
    try:
        with urllib.request.urlopen(urllib.request.Request(CATALOG, headers={"User-Agent": "kanaemi-site"}), timeout=60) as r:
            version, packages = parse_catalog(r.read())
    except urllib.error.HTTPError as error:
        if error.code != 404:
            return keep_or_fail(error)
        version, packages = None, []
    except OSError as error:
        return keep_or_fail(error)
    except ValueError as error:
        print(f"fetch-installers: {error}", file=sys.stderr)
        return 1
    manifest = {"version": version, "releases": f"https://github.com/{REPOSITORY}/releases", "packages": packages}
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"fetch-installers: {version or 'no release yet'}, {len(packages)} packages")
    return 0


def keep_or_fail(error):
    if MANIFEST.exists():
        print(f"fetch-installers: {error}; keeping the catalog read before", file=sys.stderr)
        return 0
    print(f"fetch-installers: {error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
