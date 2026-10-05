import json
import unittest

from fetch_installers import parse_catalog

PKG = {"file": "Kanaemi-0.1.0.pkg", "os": "macos", "arch": "arm64", "format": "pkg", "size": 10, "sha256": "ab"}
MSI = {"file": "Kanaemi-0.1.0-x64.msi", "os": "windows", "arch": "x64", "format": "msi", "size": 20, "sha256": "cd"}


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

    def test_refuses_a_format_it_does_not_know(self):
        with self.assertRaisesRegex(ValueError, "format 2"):
            parse_catalog(json.dumps({"format": 2, "version": "v0.1.0", "packages": [PKG]}).encode())

    def test_refuses_a_catalog_without_packages(self):
        with self.assertRaisesRegex(ValueError, "no packages"):
            parse_catalog(json.dumps({"format": 1, "version": "v0.1.0", "packages": []}).encode())


if __name__ == "__main__":
    unittest.main()
