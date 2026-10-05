import { test } from "node:test";
import assert from "node:assert/strict";
import { byOs, packageLabel, type Package } from "./installers.ts";

const pkg = (os: string, arch: string, format: string): Package => ({
  file: `Kanaemi-0.1.0.${format}`,
  os,
  arch,
  format,
  size: 1,
  sha256: "",
  url: `https://example/${os}-${arch}.${format}`,
});

test("packageLabel names the CPU and the format the way a user knows them", () => {
  assert.equal(packageLabel(pkg("macos", "arm64", "pkg")), "Apple シリコン（M1 以降）の Mac（.pkg）");
  assert.equal(packageLabel(pkg("windows", "x64", "msi")), "Intel・AMD の CPU（.msi）");
  assert.equal(packageLabel(pkg("windows", "arm64", "msi")), "Arm の CPU・Snapdragon など（.msi）");
  assert.equal(packageLabel(pkg("linux", "x64", "deb")), "Debian・Ubuntu、Intel・AMD の CPU（.deb）");
  assert.equal(packageLabel(pkg("linux", "arm64", "rpm")), "Fedora など、Arm の CPU（.rpm）");
});

test("byOs groups the packages by OS, in a fixed order, keeping the catalog order within", () => {
  const groups = byOs([
    pkg("linux", "x64", "deb"),
    pkg("macos", "arm64", "pkg"),
    pkg("linux", "x64", "rpm"),
    pkg("windows", "x64", "msi"),
  ]);
  assert.deepEqual(
    groups.map((g) => [g.label, g.packages.map((p) => p.format)]),
    [
      ["macOS", ["pkg"]],
      ["Windows", ["msi"]],
      ["Linux", ["deb", "rpm"]],
    ],
  );
});

test("byOs leaves out an OS with no package", () => {
  assert.deepEqual(
    byOs([pkg("windows", "x64", "msi")]).map((g) => g.os),
    ["windows"],
  );
});
