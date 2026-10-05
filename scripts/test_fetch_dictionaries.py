import hashlib
import io
import json
import unittest
import zipfile

from fetch_dictionaries import parse_catalog, short_label, verify


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def archive(files):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as z:
        for name, data in files.items():
            z.writestr(name, data)
    return buffer.getvalue()


TSV = "# Kanaemi 公式辞書・基本（kanaemi-dict）\nきしゃ\t記者\t\t20\n".encode()
MODEL = b"KANAEMIM-weights"
BASE = {
    "name": "base",
    "base": True,
    "label": "Kanaemi 公式辞書・基本（kanaemi-dict）",
    "archive": "kanaemi-base.zip",
    "dictionary": {"file": "kanaemi-base.tsv", "size": len(TSV), "sha256": sha256(TSV)},
    "model": {"format": 3, "sha256": sha256(MODEL)},
}


class ShortLabel(unittest.TestCase):
    def test_takes_the_label_between_the_dot_and_the_bracket(self):
        self.assertEqual(short_label("Kanaemi 公式辞書・鉄道（kanaemi-dict）", "railway"), "鉄道")
        self.assertEqual(short_label("Kanaemi 公式辞書・2026年の新語（kanaemi-dict）", "2026"), "2026年の新語")

    def test_falls_back_to_the_name_when_the_label_has_another_shape(self):
        self.assertEqual(short_label("鉄道の辞書", "railway"), "railway")
        self.assertEqual(short_label("", "railway"), "railway")


class ParseCatalog(unittest.TestCase):
    def test_returns_the_dictionaries_in_the_catalog_order(self):
        catalog = {"format": 1, "dictionaries": [BASE, {**BASE, "name": "it", "base": False}]}
        self.assertEqual([d["name"] for d in parse_catalog(json.dumps(catalog).encode())], ["base", "it"])

    def test_refuses_a_format_it_does_not_know(self):
        with self.assertRaisesRegex(ValueError, "format 2"):
            parse_catalog(json.dumps({"format": 2, "dictionaries": [BASE]}).encode())

    def test_refuses_a_catalog_without_dictionaries(self):
        with self.assertRaisesRegex(ValueError, "no dictionaries"):
            parse_catalog(json.dumps({"format": 1, "dictionaries": []}).encode())


class Verify(unittest.TestCase):
    def test_accepts_an_archive_whose_files_match_the_catalog(self):
        data = archive({"base/kanaemi-base.tsv": TSV, "base/ranking.model": MODEL, "base/LICENSE": b"CC BY 4.0"})
        verify(BASE, data)

    def test_refuses_a_dictionary_that_differs_from_the_catalog(self):
        data = archive({"base/kanaemi-base.tsv": TSV + b"x", "base/ranking.model": MODEL})
        with self.assertRaisesRegex(ValueError, "kanaemi-base.tsv"):
            verify(BASE, data)

    def test_refuses_a_model_that_differs_from_the_catalog(self):
        data = archive({"base/kanaemi-base.tsv": TSV, "base/ranking.model": MODEL + b"x"})
        with self.assertRaisesRegex(ValueError, "ranking.model"):
            verify(BASE, data)

    def test_refuses_an_archive_missing_the_dictionary(self):
        data = archive({"base/LICENSE": b"CC BY 4.0"})
        with self.assertRaisesRegex(ValueError, "kanaemi-base.tsv"):
            verify(BASE, data)



if __name__ == "__main__":
    unittest.main()
