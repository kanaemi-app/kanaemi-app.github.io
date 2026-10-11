/**
 * Keys in the pages: `<kbd>;1ko</kbd>`, keys typed one after another, is
 * shown as a key each, as no keyboard has a key ";1ko"; and the key that
 * begins a reading, `;`, is marked so that it stands out.
 */
import { defineHastPlugin } from "satteri";

export interface KeyNode {
  type: "element";
  tagName: "kbd";
  properties: { className?: string[] };
  children: [{ type: "text"; value: string }];
}

/** Keys typed in a row: lowercase letters, digits and `;`. A key named by
 * its name (Tab, 英数) starts otherwise and stays one key. */
const TYPED = /^[a-z0-9;-]{2,}$/;

const BEGIN = ";";

function key(text: string): KeyNode {
  return {
    type: "element",
    tagName: "kbd",
    properties: text === BEGIN ? { className: ["key-begin"] } : {},
    children: [{ type: "text", value: text }],
  };
}

/** The keys to show for a `<kbd>` holding `text`, or `undefined` to leave it as it is. */
export function typedKeys(text: string): KeyNode[] | undefined {
  if (TYPED.test(text)) return [...text].map(key);
  if (text === BEGIN) return [key(BEGIN)];
  return undefined;
}

/** The keys for a `<kbd>` with only text in it; a page in MDX has its
 * `<kbd>` as a JSX element, one in Markdown as an HTML element. */
function keysOf(children: readonly { type: string; value?: string }[]): KeyNode[] | undefined {
  const [child, ...rest] = children;
  if (child?.type !== "text" || child.value === undefined || rest.length > 0) return undefined;
  return typedKeys(child.value);
}

export const splitTypedKeys = defineHastPlugin({
  name: "typed-keys",
  element: {
    filter: ["kbd"],
    visit(node, ctx) {
      const keys = keysOf(node.children);
      if (keys) ctx.replaceNode(node, keys);
    },
  },
  mdxJsxTextElement: {
    filter: ["kbd"],
    visit(node, ctx) {
      const keys = keysOf(node.children);
      if (keys) ctx.replaceNode(node, keys);
    },
  },
});
