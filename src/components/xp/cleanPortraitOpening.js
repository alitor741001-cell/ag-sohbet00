// Only the enclosed portrait region is traversed; lettering and outer artwork stay intact.
export default function cleanPortraitOpening(pixels, opening) {
  const { data, width, height } = pixels;
  const [ox, oy, ow, oh] = opening;
  const cx = Math.round((ox + ow / 2) * width), cy = Math.round((oy + oh / 2) * height);
  const seen = new Uint8Array(width * height), hole = new Uint8Array(width * height), queue = [];
  const minX = Math.max(0, Math.floor((ox - .10) * width)), maxX = Math.min(width - 1, Math.ceil((ox + ow + .10) * width));
  const minY = Math.max(0, Math.floor((oy - .06) * height)), maxY = Math.min(height - 1, Math.ceil((oy + oh + .08) * height));
  const add = (x, y) => {
    if (x < minX || x > maxX || y < minY || y > maxY) return;
    const p = y * width + x;
    if (seen[p]) return;
    seen[p] = 1;
    const i = p * 4, high = Math.max(data[i], data[i + 1], data[i + 2]), low = Math.min(data[i], data[i + 1], data[i + 2]);
    if (data[i + 3] < 32 || (high <= 24 && high - low <= 12)) queue.push(p);
  };
  add(cx, cy);
  let left = width, top = height, right = 0, bottom = 0;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const p = queue[cursor], x = p % width, y = Math.floor(p / width);
    hole[p] = 255; data[p * 4 + 3] = 0;
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    add(x - 1, y); add(x + 1, y); add(x, y - 1); add(x, y + 1);
  }
  // Preserve antialiased ornament edges; reveal the photo through their existing alpha.
  const mask = new Uint8ClampedArray(data.length);
  for (const p of queue) {
    mask[p * 4 + 3] = 255;
    const x = p % width;
    for (const n of [x ? p - 1 : p, x < width - 1 ? p + 1 : p, p - width, p + width]) {
      if (n < 0 || n >= hole.length || hole[n]) continue;
      mask[n * 4 + 3] = 255 - data[n * 4 + 3];
    }
  }
  return { mask, bounds: queue.length ? [(left - 2) / width, (top - 2) / height, (right - left + 5) / width, (bottom - top + 5) / height] : opening };
}