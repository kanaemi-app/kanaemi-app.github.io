import { test } from "node:test";
import assert from "node:assert/strict";
import { webpSize } from "./webp-size.ts";

function riff(chunk: string, body: number[]): Uint8Array {
  const bytes = [...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP"), ...Buffer.from(chunk), 0, 0, 0, 0, ...body];
  return Uint8Array.from(bytes);
}

test("webpSize reads a lossy image's size from its frame header", () => {
  // Frame tag, start code, then 14-bit width and height.
  const body = [0, 0, 0, 0x9d, 0x01, 0x2a, 0x38, 0x04, 0x2c, 0x03];
  assert.deepEqual(webpSize(riff("VP8 ", body)), { width: 1080, height: 812 });
});

test("webpSize reads a lossless image's size from its packed header", () => {
  // Signature, then width - 1 and height - 1 in 14 bits each.
  const w = 935, h = 527;
  const bits = w | (h << 14);
  const body = [0x2f, bits & 0xff, (bits >> 8) & 0xff, (bits >> 16) & 0xff, (bits >> 24) & 0xff];
  assert.deepEqual(webpSize(riff("VP8L", body)), { width: 936, height: 528 });
});

test("webpSize reads an extended image's size from its canvas", () => {
  // Flags and reserved bytes, then width - 1 and height - 1 in 24 bits each.
  const body = [0, 0, 0, 0, 0x13, 0x03, 0x00, 0x77, 0x01, 0x00];
  assert.deepEqual(webpSize(riff("VP8X", body)), { width: 788, height: 376 });
});

test("webpSize refuses what is not a WebP image", () => {
  assert.throws(() => webpSize(Uint8Array.from(Buffer.from("not an image at all, really"))));
});
