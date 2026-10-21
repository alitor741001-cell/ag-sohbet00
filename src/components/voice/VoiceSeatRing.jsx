/**
 * Koltuk çemberi görseli — üç katmanlı desen:
 * 1) dış tırtıklı altın taç halkası, 2) turkuaz-gold metal bant, 3) turkuaz çentikli iç bant.
 * Katmanlar tam daire olarak çizilir; ortadaki içerik daireyi kapladığı için yalnızca halka görünür.
 */
const RING_LAYERS = [
  {
    inset: '-11%',
    background: 'repeating-conic-gradient(from 0deg, #f6dda2 0deg 2.2deg, #0a1626 2.2deg 8deg)',
  },
  {
    inset: '-5.5%',
    background:
      'conic-gradient(from 175deg, #fff6de 0%, #e8c47c 14%, #6cd4d6 33%, #0f2740 55%, #e8c47c 74%, #fff6de 100%)',
  },
  {
    inset: '-2.5%',
    background:
      'repeating-conic-gradient(from 18deg, rgba(108,212,214,0.92) 0deg 2.6deg, rgba(9,18,32,0.55) 2.6deg 8.6deg)',
  },
];

export default function VoiceSeatRing({ children, className = '', glow }) {
  return (
    <span
      className={`relative block shrink-0 rounded-full ${className}`}
      style={{ boxShadow: glow || '0 4px 12px -5px rgba(0,0,0,0.9), 0 0 12px -5px rgba(108,212,214,0.6)' }}
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