import type { Manifest } from "./dictionaries";

const found = Object.values(import.meta.glob<Manifest>("../data/dictionaries.json", { eager: true, import: "default" }));
if (found.length === 0) {
  throw new Error("src/data/dictionaries.json is missing; run `npm run fetch`");
}

/** The latest kanaemi-dict release, as scripts/fetch_dictionaries.py recorded it. */
export const manifest: Manifest = found[0];
