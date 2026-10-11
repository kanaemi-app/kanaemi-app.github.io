/** One installer as Kanaemi's release catalog lists it, with its download URL. */
export interface Package {
  file: string;
  os: string;
  arch: string;
  /** The input method framework a Linux package runs in: ibus or fcitx5. */
  framework?: string;
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

/** In the order a Linux user meets them: IBus is what GNOME, and so most distributions, start with. */
const FRAMEWORKS: [string, string][] = [
  ["ibus", "IBus"],
  ["fcitx5", "Fcitx5"],
];

/** The machine named the way its owner can check it, not by the architecture's name. */
function cpu(p: Package): string {
  if (p.os === "macos") return p.arch === "arm64" ? "Apple シリコン（M1 以降）の Mac" : "Intel の Mac";
  if (p.arch === "x64") return "Intel・AMD の CPU";
  if (p.os === "windows") return "Arm の CPU・Snapdragon など";
  return "Arm の CPU";
}

/**
 * What tells a user which file is theirs: on Linux the input method framework
 * and the distribution, then the CPU and the format.
 */
export function packageLabel(p: Package): string {
  const framework = FRAMEWORKS.find(([id]) => id === p.framework)?.[1];
  const distribution = DISTRIBUTIONS[p.format];
  return `${framework ? `${framework} 用、` : ""}${distribution ? `${distribution}、` : ""}${cpu(p)}（.${p.format}）`;
}

const frameworkOrder = (p: Package) => FRAMEWORKS.findIndex(([id]) => id === p.framework);

/** The packages by OS, the Linux ones by framework; otherwise in the catalog's order. */
export function byOs(packages: Package[]): { os: string; label: string; packages: Package[] }[] {
  return OS.map(([os, label]) => ({
    os,
    label,
    packages: packages.filter((p) => p.os === os).sort((a, b) => frameworkOrder(a) - frameworkOrder(b)),
  })).filter((g) => g.packages.length > 0);
}
