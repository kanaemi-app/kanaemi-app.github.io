import { defineHastPlugin, defineMdastPlugin, markdownToHtml } from "satteri";

/** One published release of Kanaemi, as scripts/fetch_releases.py writes it. */
export interface Release {
  version: string;
  url: string;
  published_at: string;
  /** The day it was published in Japan, written the Japanese way. */
  date: string;
  prerelease: boolean;
  /** The release notes as written on GitHub, in Markdown; empty when there are none. */
  body: string;
}

/** An X.Y release with the patch releases and prereleases folded into it, newest first. */
export interface ReleaseGroup extends Release {
  patches: Release[];
}

/** src/data/releases.json, as scripts/fetch_releases.py writes it. */
export interface Releases {
  releases: string;
  /** Newest first; empty while Kanaemi has no release. */
  groups: ReleaseGroup[];
}

const LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const IMAGE_PROTOCOLS = new Set(["http:", "https:"]);

function allowed(url: string, protocols: Set<string>): boolean {
  return URL.canParse(url) && protocols.has(new URL(url).protocol);
}

/**
 * The notes come from whoever writes them on GitHub, so nothing they hold may
 * run on the site: raw HTML is dropped rather than escaped, which would show
 * the tags as text.
 */
const safeNotes = defineMdastPlugin({
  name: "release-notes",
  html(node, ctx) {
    ctx.removeNode(node);
  },
  heading(node, ctx) {
    // The page heads each version with h2 and each patch with h3.
    ctx.setProperty(node, "depth", Math.min(node.depth + 2, 6) as typeof node.depth);
  },
});

/**
 * Links lose any scheme but the web's and mail's, and images any but the
 * web's. Checked on the HTML rather than the Markdown, where a link written by
 * reference only gets its URL once the reference is resolved.
 */
const safeUrls = defineHastPlugin({
  name: "release-notes-urls",
  element: {
    filter: ["a", "img"],
    visit(node, ctx) {
      if (node.tagName === "a" && !allowed(String(node.properties.href ?? ""), LINK_PROTOCOLS)) {
        ctx.replaceNode(node, [...node.children]);
      }
      if (node.tagName === "img" && !allowed(String(node.properties.src ?? ""), IMAGE_PROTOCOLS)) {
        ctx.removeNode(node);
      }
    },
  },
});

/** The HTML of a release's notes, safe to put on the page as it is. */
export function renderNotes(markdown: string): string {
  return markdownToHtml(markdown, {
    mdastPlugins: [safeNotes],
    hastPlugins: [safeUrls],
    features: { frontmatter: false },
  }).html;
}
