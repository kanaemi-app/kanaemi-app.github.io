"""Check that every site-internal link in dist/ points at a page that exists,
and that its #fragment names an id on that page. Run after `npm run build`."""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

DIST = Path(__file__).resolve().parents[1] / "dist"


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        if tag == "a" and a.get("href"):
            self.links.append(a["href"])


def target(path):
    p = DIST / path.lstrip("/")
    return p / "index.html" if p.is_dir() or not p.suffix else p


pages = {}
for html in DIST.rglob("*.html"):
    page = Page()
    page.feed(html.read_text())
    pages[html] = page

broken = []
for html, page in pages.items():
    for href in page.links:
        url = urlsplit(href)
        if url.scheme or url.netloc:
            continue
        dest = html if not url.path else target(unquote(url.path))
        if not dest.exists():
            broken.append(f"{html.relative_to(DIST)}: {href} (no page)")
            continue
        frag = unquote(url.fragment)
        if frag and dest in pages and frag not in pages[dest].ids:
            broken.append(f"{html.relative_to(DIST)}: {href} (no #{frag})")

for b in sorted(set(broken)):
    print(b)
sys.exit(1 if broken else 0)
