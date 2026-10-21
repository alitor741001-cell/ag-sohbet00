/**
 * Koltuk çemberi görseli — mücevher işlemeli dört katman:
 * 1) dış turkuaz ışıma, 2) fasetli altın taş tırtılı, 3) turkuaz mine + parlak altın bant,
 * 4) krem inci çentikler. Katmanlar tam daire çizilir; ortadaki içerik daireyi kapladığı için
 * yalnızca halka görünür.
 */
const RING_LAYERS = [
  {
    inset: '-17%',
    background:
      'radial-gradient(circle, rgba(108,212,214,0) 58%, rgba(108,212,214,0.5) 70%, rgba(108,212,214,0) 84%)',
  },
  {
    inset: '-9%',
    background:
      'repeating-conic-gradient(from 0deg, #0a1626 0deg 4deg, #fff8e6 4deg 6deg, #e8c47c 6deg 12deg, #7c5a21 12deg 14deg, #0a1626 14deg 18deg)',
  },
  {
    inset: '-5%',
    background: [
      'linear-gradient(150deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0) 46%)',
      'radial-gradient(circle, rgba(0,0,0,0) 52%, rgba(0,0,0,0.42) 76%, rgba(255,255,255,0.4) 88%, rgba(0,0,0,0.55) 100%)',
      'conic-gradient(from 205deg, #fff3d2 0deg, #e8c47c 42deg, #1a7a83 72deg, #6cd4d6 104deg, #0f2740 136deg, #e8c47c 172deg, #fff3d2 205deg, #e8c47c 244deg, #1a7a83 274deg, #6cd4d6 306deg, #0f2740 338deg, #e8c47c 360deg)',
    ].join(', '),
  },
  {
    inset: '-1.5%',
    background:
      'repeating-conic-gradient(from 9deg, rgba(255,246,222,0.95) 0deg 1.6deg, rgba(9,18,32,0.62) 1.6deg 9deg)',
  },
];

export default function VoiceSeatRing({ children, className = '', glow }) {
  return (
    <span
      className={`relative block shrink-0 rounded-full ${className}`}
      style={{
        boxShadow: glow || '0 4px 12px -5px rgba(0,0,0,0.9), 0 0 14px -4px rgba(108,212,214,0.65)',
      }}
    >
      {RING_LAYERS.map((layer) => (
        <span
          key={layer.inset}
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full"
          style={{ inset: layer.inset, background: layer.background }}
        />
      ))}
      <span
        className="relative block h-full w-full overflow-hidden rounded-full bg-[#08101d]"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(6,12,22,0.85), inset 0 2px 6px rgba(0,0,0,0.55)' }}
      >
        {children}
      </span>
    </span>
  );
}