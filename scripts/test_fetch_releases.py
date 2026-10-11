import json
import unittest

from fetch_releases import group_releases, japanese_date, parse_releases


def release(tag, published_at, **fields):
    return {
        "tag_name": tag,
        "html_url": f"https://github.com/kanaemi-app/kanaemi/releases/tag/{tag}",
        "draft": False,
        "prerelease": False,
        "published_at": published_at,
        "body": f"notes of {tag}",
        **fields,
    }


def entry(tag, published_at):
    return {"version": tag, "published_at": published_at}


class JapaneseDate(unittest.TestCase):
    def test_writes_the_day_in_japan(self):
        self.assertEqual(japanese_date("2026-10-08T08:50:21Z"), "2026年10月8日")
        self.assertEqual(japanese_date("2026-10-10T15:00:00Z"), "2026年10月11日")


class ParseReleases(unittest.TestCase):
    def test_reads_each_release_from_every_page(self):
        pages = [
            json.dumps([release("v0.4.1", "2026-10-08T08:50:21Z")]).encode(),
            json.dumps([release("v0.4.0", "2026-10-08T04:06:36Z", prerelease=True)]).encode(),
        ]
        self.assertEqual(
            parse_releases(pages),
            [
                {
                    "version": "v0.4.1",
                    "url": "https://github.com/kanaemi-app/kanaemi/releases/tag/v0.4.1",
                    "published_at": "2026-10-08T08:50:21Z",
                    "date": "2026年10月8日",
                    "prerelease": False,
                    "body": "notes of v0.4.1",
                },
                {
                    "version": "v0.4.0",
                    "url": "https://github.com/kanaemi-app/kanaemi/releases/tag/v0.4.0",
                    "published_at": "2026-10-08T04:06:36Z",
                    "date": "2026年10月8日",
                    "prerelease": True,
                    "body": "notes of v0.4.0",
                },
            ],
        )

    def test_leaves_out_drafts(self):
        page = json.dumps(
            [release("v0.5.0", None, draft=True), release("v0.4.1", "2026-10-08T08:50:21Z")]
        ).encode()
        self.assertEqual([r["version"] for r in parse_releases([page])], ["v0.4.1"])

    def test_takes_a_missing_body_as_empty(self):
        page = json.dumps([release("v0.1.0", "2026-10-05T18:00:15Z", body=None)]).encode()
        self.assertEqual(parse_releases([page])[0]["body"], "")


class GroupReleases(unittest.TestCase):
    def test_folds_the_patches_into_their_minor_release_newest_first(self):
        groups = group_releases(
            [
                entry("v0.4.1", "2026-10-08T08:50:21Z"),
                entry("v0.4.0", "2026-10-08T04:06:36Z"),
                entry("v0.3.0", "2026-10-06T18:21:14Z"),
                entry("v0.1.3", "2026-10-06T05:56:38Z"),
                entry("v0.1.0", "2026-10-05T18:00:15Z"),
                entry("v0.1.1", "2026-10-05T18:25:06Z"),
            ]
        )
        self.assertEqual(
            [(g["version"], [p["version"] for p in g["patches"]]) for g in groups],
            [("v0.4.0", ["v0.4.1"]), ("v0.3.0", []), ("v0.1.0", ["v0.1.3", "v0.1.1"])],
        )

    def test_heads_a_minor_release_without_its_x_y_0_by_its_earliest_release(self):
        groups = group_releases(
            [
                entry("v0.2.2", "2026-10-07T00:00:00Z"),
                entry("v0.2.1", "2026-10-06T00:00:00Z"),
                entry("v0.1.0", "2026-10-05T00:00:00Z"),
            ]
        )
        self.assertEqual(
            [(g["version"], [p["version"] for p in g["patches"]]) for g in groups],
            [("v0.2.1", ["v0.2.2"]), ("v0.1.0", [])],
        )

    def test_folds_a_prerelease_of_x_y_0_into_the_x_y_0_release(self):
        groups = group_releases(
            [
                entry("v0.5.0", "2026-10-12T00:00:00Z"),
                entry("v0.5.0-rc.1", "2026-10-11T00:00:00Z"),
            ]
        )
        self.assertEqual(
            [(g["version"], [p["version"] for p in g["patches"]]) for g in groups],
            [("v0.5.0", ["v0.5.0-rc.1"])],
        )

    def test_gives_a_tag_that_is_not_a_version_a_section_of_its_own(self):
        groups = group_releases(
            [
                entry("nightly", "2026-10-09T00:00:00Z"),
                entry("v0.4.0", "2026-10-08T00:00:00Z"),
            ]
        )
        self.assertEqual(
            [(g["version"], g["patches"]) for g in groups],
            [("nightly", []), ("v0.4.0", [])],
        )

    def test_orders_the_sections_by_the_date_of_their_head(self):
        # A fix to an older minor release, published after a newer one, stays
        # in the older section and does not move it up.
        groups = group_releases(
            [
                entry("v0.4.2", "2026-10-12T00:00:00Z"),
                entry("v0.5.0", "2026-10-11T00:00:00Z"),
                entry("v0.4.0", "2026-10-08T00:00:00Z"),
            ]
        )
        self.assertEqual([g["version"] for g in groups], ["v0.5.0", "v0.4.0"])


if __name__ == "__main__":
    unittest.main()
