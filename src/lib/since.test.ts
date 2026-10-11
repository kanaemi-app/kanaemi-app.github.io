import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FIRST_RELEASE,
  NEXT_RELEASE,
  RELEASED,
  SINCE,
  badgeShown,
  knownVersions,
  sinceLabel,
} from "./since.ts";

test("every feature arrived in a released tag or in the next release", () => {
  const known = new Set<string>([...RELEASED, NEXT_RELEASE]);
  for (const [feature, { version }] of Object.entries(SINCE)) {
    assert.ok(known.has(version), `${feature}: ${version}`);
  }
});

test("nothing is marked as arriving in the first release, which every page already describes", () => {
  for (const [feature, { version }] of Object.entries(SINCE)) {
    assert.notEqual(version, FIRST_RELEASE, feature);
  }
});

test("every feature names the commit it was traced to", () => {
  for (const [feature, { commit }] of Object.entries(SINCE)) {
    assert.match(commit, /^[0-9a-f]{7,40}$/, feature);
  }
});

test("sinceLabel says from which version a feature can be used", () => {
  assert.equal(sinceLabel("complete"), "v0.5.0 から");
  assert.equal(sinceLabel("undo-commit"), "v0.2.0 から");
});

test("sinceLabel throws for a feature it does not know, so a typo in a page fails the build", () => {
  assert.throws(() => sinceLabel("no-such-feature"), /no-such-feature/);
});

test("badgeShown shows a version in any of the five newest minor lines", () => {
  const known = ["v0.1.0", "v0.2.0", "v0.3.0", "v0.4.0", "v0.5.0"];
  for (const version of known) assert.ok(badgeShown(version, known), version);
});

test("badgeShown counts a patch release by its minor line", () => {
  const known = ["v0.1.0", "v0.1.3", "v0.1.5", "v0.2.0", "v0.3.0", "v0.4.0", "v0.4.1", "v0.5.0"];
  assert.ok(badgeShown("v0.1.3", known));
  assert.ok(badgeShown("v0.4.1", known));
});

test("badgeShown hides the oldest line once a sixth line exists", () => {
  const known = ["v0.1.0", "v0.1.3", "v0.2.0", "v0.3.0", "v0.4.0", "v0.5.0", "v0.6.0"];
  assert.equal(badgeShown("v0.1.3", known), false);
  assert.ok(badgeShown("v0.2.0", known));
  assert.ok(badgeShown("v0.6.0", known));
});

test("badgeShown orders the lines as numbers, not as text", () => {
  const known = ["v0.9.0", "v0.10.0", "v0.11.0", "v0.12.0", "v0.13.0", "v0.14.0"];
  assert.equal(badgeShown("v0.9.0", known), false);
  assert.ok(badgeShown("v0.10.0", known));
});

test("knownVersions joins the recorded releases, the upcoming one and any fetched ones", () => {
  const versions = knownVersions(["v0.6.0"]);
  assert.ok(versions.includes("v0.4.1"));
  assert.ok(versions.includes(NEXT_RELEASE));
  assert.ok(versions.includes("v0.6.0"));
});

test("knownVersions leaves out fetched tags that are not plain versions, such as a release candidate", () => {
  assert.ok(!knownVersions(["v0.6.0-rc.1"]).includes("v0.6.0-rc.1"));
});
