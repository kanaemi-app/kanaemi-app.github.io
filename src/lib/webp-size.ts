/**
 * The size of a WebP image, read from its header, so a page can reserve the
 * room an image takes before it loads.
 */
export function webpSize(bytes: Uint8Array): { width: number; height: number } {
  const text = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  if (bytes.length < 16 || text(0, 4) !== "RIFF" || text(8, 12) !== "WEBP") {
    throw new Error("not a WebP image");
  }
  const at = (i: number) => {
    if (20 + i >= bytes.length) throw new Error("the WebP header is cut short");
    return bytes[20 + i];
  };
  switch (text(12, 16)) {
    case "VP8 ":
      return { width: (at(6) | (at(7) << 8)) & 0x3fff, height: (at(8) | (at(9) << 8)) & 0x3fff };
    case "VP8L": {
      const bits = at(1) | (at(2) << 8) | (at(3) << 16) | (at(4) << 24);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    case "VP8X":
      return {
        width: (at(4) | (at(5) << 8) | (at(6) << 16)) + 1,
        height: (at(7) | (at(8) << 8) | (at(9) << 16)) + 1,
      };
    default:
      throw new Error(`unknown WebP chunk "${text(12, 16)}"`);
  }
}
