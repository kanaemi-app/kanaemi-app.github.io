import json
import unittest

from fetch_installers import parse_catalog

PKG = {"file": "Kanaemi-0.1.0.pkg", "os": "macos", "arch": "arm64", "format": "pkg", "size": 10, "sha256": "ab"}
MSI = {"file": "Kanaemi-0.1.0-x64.msi", "os": "windows", "arch": "x64", "format": "msi", "size": 20, "sha256": "cd"}
OLD_DEB = {"file": "kanaemi_0.4.1_amd64.deb", "os": "linux", "arch": "x64", "format": "deb", "size": 30, "sha256": "ef"}
IBUS_DEB = {**OLD_DEB, "file": "ibus-kanaemi_0.5.0_amd64.deb", "framework": "ibus"}
FCITX5_DEB = {**OLD_DEB, "file": "fcitx5-kanaemi_0.5.0_amd64.deb", "framework": "fcitx5"}


class ParseCatalog(unittest.TestCase):
    def test_links_each_package_to_the_release_of_its_version(self):
        catalog = {"format": 1, "version": "v0.1.0", "packages": [PKG, MSI]}
        version, packages = parse_catalog(json.dumps(catalog).encode())
        self.assertEqual(version, "v0.1.0")
        self.assertEqual(
            [p["url"] for p in packages],
            [
                "https://github.com/kanaemi-app/kanaemi/releases/download/v0.1.0/Kanaemi-0.1.0.pkg",
                "https://github.com/kanaemi-app/kanaemi/releases/download/v0.1.0/Kanaemi-0.1.0-x64.msi",
            ],
        )
        self.assertEqual(packages[0]["os"], "macos")

    def test_carries_the_framework_of_each_linux_package(self):
        catalog = {"format": 2, "version": "v0.5.0", "packages": [PKG, IBUS_DEB, FCITX5_DEB]}
        _, packages = parse_catalog(json.dumps(catalog).encode())
        self.assertEqual([p.get("framework") for p in packages], [None, "ibus", "fcitx5"])

    def test_takes_the_linux_packages_of_format_1_as_ibus_ones(self):
        catalog = {"format": 1, "version": "v0.4.1", "packages": [PKG, OLD_DEB]}
        _, packages = parse_catalog(json.dumps(catalog).encode())
        self.assertEqual([p.get("framework") for p in packages], [None, "ibus"])

    def test_refuses_a_linux_package_of_format_2_without_a_known_framework(self):
        unknown = {**FCITX5_DEB, "framework": "uim"}
        for package in ({k: v for k, v in FCITX5_DEB.items() if k != "framework"}, unknown):
            with self.subTest(package=package), self.assertRaisesRegex(ValueError, "framework"):
                parse_catalog(json.dumps({"format": 2, "version": "v0.5.0", "packages": [package]}).encode())

    def test_refuses_a_format_it_does_not_know(self):
        with self.assertRaisesRegex(ValueError, "format 3"):
            parse_catalog(json.dumps({"format": 3, "version": "v0.1.0", "packages": [PKG]}).encode())

    def test_refuses_a_catalog_without_packages(self):
        with self.assertRaisesRegex(ValueError, "no packages"):
            parse_catalog(json.dumps({"format": 1, "version": "v0.1.0", "packages": []}).encode())


if __name__ == "__main__":
    unittest.main()
