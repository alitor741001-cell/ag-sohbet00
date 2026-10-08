// Şeker gövdeleri: her şekil kendi SVG gövdesini ve cam parlamasını çizer.
const GLOSS = '#ffffff';

// Mor çiçeğin altı taç yaprağı: merkezin çevresine eşit aralıkla dizilir.
const PETALS = Array.from({ length: 6 }, (_, index) => {
  const angle = (index * 60 * Math.PI) / 180;
  return [20 + 8.6 * Math.cos(angle), 20 + 8.6 * Math.sin(angle)];
});

export const SEKER_SHAPES = {
  square: ({ fill }) => (
    <>
      <rect x="7" y="7" width="26" height="26" rx="7" fill={fill} />
      <ellipse cx="16" cy="15" rx="5.4" ry="3.6" fill={GLOSS} opacity="0.42" />
      <ellipse cx="13.6" cy="12.6" rx="2.6" ry="1.8" fill={GLOSS} opacity="0.95" />
    </>
  ),
  oval: ({ fill }) => (
    <>
      <ellipse cx="20" cy="21" rx="14.4" ry="11" fill={fill} />
      <ellipse cx="20" cy="16.4" rx="7.2" ry="3.6" fill={GLOSS} opacity="0.4" />
      <ellipse cx="16" cy="14.6" rx="3" ry="1.8" fill={GLOSS} opacity="0.9" />
    </>
  ),
  sphere: ({ fill }) => (
    <>
      <circle cx="20" cy="20" r="14.2" fill={fill} />
      <ellipse cx="15" cy="14" rx="5.4" ry="4.2" fill={GLOSS} opacity="0.5" />
      <ellipse cx="13.6" cy="12.4" rx="2.6" ry="1.9" fill={GLOSS} opacity="0.95" />
    </>
  ),
  bean: ({ fill }) => (
    <g transform="rotate(-14 20 20)">
      <rect x="6" y="15" width="28" height="11" rx="5.5" fill={fill} />
      <ellipse cx="14" cy="18.6" rx="4.6" ry="1.9" fill={GLOSS} opacity="0.5" />
      <ellipse cx="12.4" cy="17.7" rx="2.2" ry="1.1" fill={GLOSS} opacity="0.95" />
    </g>
  ),
  flower: ({ fill, dark }) => (
    <>
      {PETALS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5.6" fill={fill} />
      ))}
      <circle cx="20" cy="20" r="4.6" fill={dark} />
      <circle cx="16" cy="15" r="1.8" fill={GLOSS} opacity="0.95" />
      <circle cx="24.4" cy="25" r="1.3" fill={GLOSS} opacity="0.7" />
    </>
  ),
  drop: ({ fill }) => (
    <>
      <path d="M20 4.5c6.2 7.8 11.4 13.4 11.4 19.6a11.4 11.4 0 0 1-22.8 0C8.6 17.9 13.8 12.3 20 4.5z" fill={fill} />
      <ellipse cx="17" cy="17" rx="3.4" ry="2.4" fill={GLOSS} opacity="0.5" />
      <ellipse cx="16" cy="15.6" rx="1.7" ry="1.1" fill={GLOSS} opacity="0.95" />
    </>
  ),
  wrapped: ({ fill, light, dark }) => (
    <>
      <path d="M10.5 20 1.8 13.5v13L10.5 20z" fill={dark} />
      <path d="M29.5 20l8.7-6.5v13L29.5 20z" fill={dark} />
      <circle cx="20" cy="20" r="10.6" fill={fill} />
      <ellipse cx="16.4" cy="15.8" rx="4" ry="3" fill={GLOSS} opacity="0.5" />
      <ellipse cx="15.2" cy="14.4" rx="2" ry="1.4" fill={GLOSS} opacity="0.95" />
      <path d="M20 24.4a10.6 10.6 0 0 0 0-21.2" fill="none" stroke={light} strokeWidth="0.9" opacity="0.5" />
    </>
  ),
};