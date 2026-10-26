/** Clear the dark panel interior, preserving the bright lettering and gold button. */
export default function removeRocketPanelBackground(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const pixels = ctx.getImageData(0, 0, width, height);
  for (let y = Math.floor(height * .50); y < height * .86; y++) {
    for (let x = Math.floor(width * .105); x < width * .90; x++) {
      const i = (y * width + x) * 4;
      const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
      const brightest = Math.max(r, g, b);
      const darkest = Math.min(r, g, b);
      // Text fronts, highlights, coins and the illuminated frame remain intact.
      if (darkest < 80 && brightest < 160) {
        const alpha = Math.max(0, Math.min(1, (brightest - 105) / 55));
        pixels.data[i + 3] = Math.round(pixels.data[i + 3] * alpha);
      }
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}