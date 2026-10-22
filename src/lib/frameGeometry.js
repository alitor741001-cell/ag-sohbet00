// Source-image aperture centers and radii, measured on the 1024-square sheets.
const APERTURES = {
  dragon: [[171,288,95],[512,286,96],[851,289,95],[171,752,94],[512,750,96],[851,750,95]],
  duality: [[171,240,125],[512,240,113],[853,240,104],[171,745,119],[512,746,104],[853,746,128]],
  butterfly: [[180,234,128],[512,232,91],[844,232,91],[179,722,92],[512,722,91],[844,722,91]],
  flower: [[171,279,127],[512,277,127],[850,276,130],[171,749,127],[512,749,127],[851,749,126]],
  crescent: [[180,191,129],[512,190,118],[844,191,128],[180,768,125],[512,768,111],[844,768,126]],
  star: [[180,192,104],[512,186,121],[844,185,116],[180,518,120],[512,517,112]],
};
const BANDS = {
  dragon: [[85,460],[550,920]], duality: [[70,425],[570,925]],
  butterfly: [[65,400],[550,890]], flower: [[90,455],[575,910]],
  crescent: [[25,360],[575,940]], star: [[20,345],[350,670]],
};
export const FRAME_APERTURE_RADIUS = 120;
export function drawAlignedFrame(ctx, image, frame) {
  const index = Number(frame.key.split('-').pop()) - 1;
  const [cx, cy, radius] = APERTURES[frame.family][index];
  const [top, bottom] = BANDS[frame.family][Math.floor(index / 3)];
  const sx = (index % 3) * 1024 / 3;
  const sw = 1024 / 3;
  const scale = FRAME_APERTURE_RADIUS / radius;
  ctx.drawImage(image, sx * image.width / 1024, top * image.height / 1024,
    sw * image.width / 1024, (bottom - top) * image.height / 1024,
    240 + (sx - cx) * scale, 240 + (top - cy) * scale, sw * scale, (bottom - top) * scale);
}