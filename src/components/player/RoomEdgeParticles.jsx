const PARTICLES = Array.from({ length: 24 });
const SIDES = ['top', 'right', 'bottom', 'left'];

export default function RoomEdgeParticles({ mode, color }) {
  if (mode === 'none') return null;
  return (
    <div className={`room-edge-particles room-edge-${mode}`} aria-hidden="true">
      {PARTICLES.map((_, index) => {
        const side = SIDES[index % SIDES.length];
        return (
          <span
            key={index}
            className={`room-edge-particle room-edge-side-${side}`}
            style={{
              '--edge-pos': `${8 + ((index * 19) % 84)}%`,
              '--edge-delay': `${(index % 8) * -0.28}s`,
              '--edge-duration': `${1.4 + (index % 4) * 0.2}s`,
              '--edge-color': color,
            }}
          >
            {mode === 'heart' ? '♥' : ''}
          </span>
        );
      })}
    </div>
  );
}