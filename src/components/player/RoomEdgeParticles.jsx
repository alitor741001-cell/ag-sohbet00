const PARTICLES = Array.from({ length: 20 });

export default function RoomEdgeParticles({ mode, color }) {
  if (mode === 'none') return null;
  return (
    <div className={`room-edge-particles room-edge-${mode}`} aria-hidden="true">
      {PARTICLES.map((_, index) => (
        <span
          key={index}
          className="room-edge-particle"
          style={{
            '--edge-x': `${4 + ((index * 17) % 92)}%`,
            '--edge-delay': `${(index % 10) * -0.32}s`,
            '--edge-duration': `${1.8 + (index % 5) * 0.22}s`,
            '--edge-color': color,
          }}
        >
          {mode === 'heart' ? '♥' : ''}
        </span>
      ))}
    </div>
  );
}