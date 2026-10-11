/** One dictionary of a kanaemi-dict release, as scripts/fetch_dictionaries.py records it. */
export interface Dictionary {
  name: string;
  base: boolean;
  file: string;
  /** Bytes of the zip. */
  size: number;
  label: string;
  model: boolean;
  /** Item lines in the dictionary. */
  entries: number;
  /** The sources the zip's NOTICE names, in its order. */
  sources: string[];
}

/** src/data/dictionaries.json. */
export interface Manifest {
  /** null while kanaemi-dict has no release with a catalog. */
  tag: string | null;
  url: string;
  dictionaries: Dictionary[];
}

export const sizeLabel = (bytes: number): string =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const entriesLabel = (entries: number): string => entries.toLocaleString("en-US");
