/** One installer as Kanaemi's release catalog lists it, with its download URL. */
export interface Package {
  file: string;
  os: string;
  arch: string;
  format: string;
  size: number;
  sha256: string;
  url: string;
}

/** src/data/installers.json, as scripts/fetch_installers.py writes it. */
export interface Installers {
  /** null while Kanaemi has no release with a catalog. */
  version: string | null;
  releases: string;
  packages: Package[];
}

const OS: [string, string][] = [
  ["macos", "macOS"],
  ["windows", "Windows"],
  ["linux", "Linux"],
];

const DISTRIBUTIONS: Record<string, string> = { deb: "Debian・Ubuntu", rpm: "Fedora など" };

/** The machine named the way its owner can check it, not by the architecture's name. */
function cpu(p: Package): string {
  if (p.os === "macos") return p.arch === "arm64" ? "Apple シリコン（M1 以降）の Mac" : "Intel の Mac";
  if (p.arch === "x64") return "Intel・AMD の CPU";
  if (p.os === "windows") return "Arm の CPU・Snapdragon など";
  return "Arm の CPU";
}

/** What tells a user which file is theirs: the CPU, the distribution on Linux, and the format. */
export function packageLabel(p: Package): string {
  const distribution = DISTRIBUTIONS[p.format];
  return `${distribution ? `${distribution}、` : ""}${cpu(p)}（.${p.format}）`;
}

export function byOs(packages: Package[]): { os: string; label: string; packages: Package[] }[] {
  return OS.map(([os, label]) => ({ os, label, packages: packages.filter((p) => p.os === os) })).filter(
    (g) => g.packages.length > 0,
  );
}
