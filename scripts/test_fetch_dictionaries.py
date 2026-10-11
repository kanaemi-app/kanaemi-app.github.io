import hashlib
import io
import json
import unittest
import zipfile

from fetch_dictionaries import describe, parse_catalog, short_label, verify


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


NOTICE = """この辞書は、次の素材を使って作った。素材の文章は辞書に含まない。

----------------------------------------------------------------------

ウィキペディア日本語版の寄稿者
https://ja.wikipedia.org/

記事の本文から、語とその出現回数を数えた。

----------------------------------------------------------------------

SudachiDict full
https://github.com/WorksApplications/SudachiDict

LEGAL NOTICE INFORMATION
========================
""".encode()


class Describe(unittest.TestCase):
    def test_records_what_the_download_table_shows(self):
        data = archive({"base/kanaemi-base.tsv": TSV, "base/ranking.model": MODEL})
        described = describe(BASE, data)
        self.assertEqual(
            {k: described[k] for k in ("name", "base", "label", "file", "size", "model")},
            {"name": "base", "base": True, "label": "基本", "file": "kanaemi-base.zip", "size": len(data), "model": True},
        )

    def test_counts_the_item_lines_of_the_dictionary_leaving_out_comments_and_blank_lines(self):
        tsv = "# Kanaemi 公式辞書・基本（kanaemi-dict）\nきしゃ\t記者\t\t20\n\n# メモ\nか\t書\t五段-カ行\t30\n".encode()
        described = describe({**BASE, "model": None}, archive({"base/kanaemi-base.tsv": tsv}))
        self.assertEqual(described["entries"], 2)

    def test_lists_the_sources_named_in_the_notice_in_its_order(self):
        data = archive({"base/kanaemi-base.tsv": TSV, "base/NOTICE": NOTICE})
        self.assertEqual(describe(BASE, data)["sources"], ["ウィキペディア日本語版の寄稿者", "SudachiDict full"])

    def test_does_not_take_a_heading_underlined_with_hyphens_inside_a_source_for_another_source(self):
        notice = NOTICE + "\nPYTHON SOFTWARE FOUNDATION LICENSE VERSION 2\n--------------------------------------------\n\n1. This LICENSE AGREEMENT\n".encode()
        data = archive({"base/kanaemi-base.tsv": TSV, "base/NOTICE": notice})
        self.assertEqual(describe(BASE, data)["sources"], ["ウィキペディア日本語版の寄稿者", "SudachiDict full"])

    def test_lists_no_sources_when_the_archive_has_no_notice(self):
        data = archive({"base/kanaemi-base.tsv": TSV})
        self.assertEqual(describe(BASE, data)["sources"], [])


if __name__ == "__main__":
    unittest.main()
