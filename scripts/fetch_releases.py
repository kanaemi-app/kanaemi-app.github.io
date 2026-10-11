"""Read every published release of Kanaemi from the GitHub API into
src/data/releases.json, for the release history page.

Each release keeps its notes as written on GitHub, in Markdown; the site
renders them. A patch release (X.Y.Z, Z > 0) and a prerelease are folded into
the section of the X.Y.0 release they belong to.

GITHUB_TOKEN, when set, is sent to raise the API's rate limit. Without the
network, the history read before is kept.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPOSITORY = "kanaemi-app/kanaemi"
API = f"https://api.github.com/repos/{REPOSITORY}/releases"
PER_PAGE = 100
# Japan keeps no daylight saving time, so a fixed offset is its time zone.
JAPAN = timezone(timedelta(hours=9))
VERSION = re.compile(r"^v?(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)(?P<suffix>.*)$")
MANIFEST = Path(__file__).resolve().parents[1] / "src" / "data" / "releases.json"


def japanese_date(published_at):
    day = datetime.fromisoformat(published_at.replace("Z", "+00:00")).astimezone(JAPAN)
    return f"{day.year}年{day.month}月{day.day}日"


def parse_releases(pages):
    return [
        {
            "version": r["tag_name"],
            "url": r["html_url"],
            "published_at": r["published_at"],
            "date": japanese_date(r["published_at"]),
            "prerelease": bool(r.get("prerelease")),
            "body": r.get("body") or "",
        }
        for page in pages
        for r in json.loads(page)
        if not r.get("draft") and r.get("published_at")
    ]


def group_releases(releases):
    """One section per X.Y, headed by X.Y.0 and holding the rest newest first;
    without an X.Y.0, the earliest release of X.Y heads it. A tag that is not
    a version is a section of its own. Sections are newest first by their head,
    so a late fix to an older X.Y does not move its section up."""
    sections = {}
    for r in releases:
        found = VERSION.match(r["version"])
        key = (int(found["major"]), int(found["minor"])) if found else r["version"]
        sections.setdefault(key, []).append(r)
    groups = []
    for members in sections.values():
        members = sorted(members, key=lambda r: r["published_at"])
        head = next((r for r in members if is_minor_release(r["version"])), members[0])
        patches = sorted((r for r in members if r is not head), key=lambda r: r["published_at"], reverse=True)
        groups.append({**head, "patches": patches})
    return sorted(groups, key=lambda g: g["published_at"], reverse=True)


def is_minor_release(version):
    found = VERSION.match(version)
    return bool(found) and found["patch"] == "0" and not found["suffix"]


def request(url):
    headers = {
        "User-Agent": "kanaemi-site",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60) as response:
        return response.read()


def fetch_pages():
    pages = []
    while True:
        page = request(f"{API}?per_page={PER_PAGE}&page={len(pages) + 1}")
        pages.append(page)
        if len(json.loads(page)) < PER_PAGE:
            return pages


def main():
    try:
        releases = parse_releases(fetch_pages())
    except OSError as error:
        return keep_or_fail(error)
    except (ValueError, KeyError) as error:
        print(f"fetch-releases: {error!r}", file=sys.stderr)
        return 1
    manifest = {"releases": f"https://github.com/{REPOSITORY}/releases", "groups": group_releases(releases)}
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"fetch-releases: {len(releases)} releases in {len(manifest['groups'])} sections")
    return 0


def keep_or_fail(error):
    if MANIFEST.exists():
        print(f"fetch-releases: {error}; keeping the history read before", file=sys.stderr)
        return 0
    print(f"fetch-releases: {error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
