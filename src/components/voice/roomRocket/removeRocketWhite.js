// Remove only neutral white connected to the outside. White lettering and
// the rocket's highlights enclosed by colour are preserved, not colour-keyed.
export default function removeRocketWhite(canvas) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const pixels = ctx.getImageData(0, 0, w, h);
  const data = pixels.data;
  const visited = new Uint8Array(w * h);
  const queue = new Uint32Array(w * h);
  let head = 0;
  let tail = 0;
  const enqueue = index => {
    if (visited[index]) return;
    visited[index] = 1;
    const offset = index * 4;
    const min = Math.min(data[offset], data[offset + 1], data[offset + 2]);
    const max = Math.max(data[offset], data[offset + 1], data[offset + 2]);
    if (min < 215 || max - min > 38) return;
    queue[tail++] = index;
  };
  for (let x = 0; x < w; x++) { enqueue(x); enqueue((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { enqueue(y * w); enqueue(y * w + w - 1); }
  while (head < tail) {
    const index = queue[head++];
    const i = index * 4;
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    data[i + 3] = Math.round(255 * Math.min(1, Math.max(0, (250 - min) / 30)));
    const x = index % w;
    if (x > 0) enqueue(index - 1);
    if (x < w - 1) enqueue(index + 1);
    if (index >= w) enqueue(index - w);
    if (index < w * (h - 1)) enqueue(index + w);
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}