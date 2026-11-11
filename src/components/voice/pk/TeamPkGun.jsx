/** Önde olan takımın profillerinin üstündeki süslü siyah su tabancası: rakibe döner, 5 saniyede bir fışkırtır. */
export default function TeamPkGun({ side }) {
  const flip = side === 'red';
  const id = `gun-${side}`;
  return (
    <span className={`team-pk-gun pointer-events-none absolute -top-4 z-20 ${flip ? '-left-3' : '-right-3'}`} style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <svg viewBox="0 0 64 40" className="h-8 w-12" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4b5563" />
            <stop offset="0.45" stopColor="#111827" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <linearGradient id={`${id}-tank`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#93c5fd" stopOpacity="0.95" />
            <stop offset="1" stopColor="#1e3a8a" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fde68a" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
        </defs>
        {/* Gölge: 3D derinlik */}
        <ellipse cx="30" cy="37" rx="18" ry="2" fill="#000" opacity="0.45" />
        {/* Su haznesi */}
        <rect x="16" y="3" width="20" height="9" rx="4.5" fill={`url(#${id}-tank)`} stroke={`url(#${id}-gold)`} strokeWidth="1.2" />
        <path d="M19 5.5h12" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
        {/* Gövde ve namlu */}
        <path d="M6 12h40l4-2h7v8h-7l-3 2H30l-3 3v1l-3 12h-9l3-13H8a4 4 0 0 1-4-4v-3a2 2 0 0 1 2-2z" fill={`url(#${id}-body)`} stroke={`url(#${id}-gold)`} strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M8 14.5h36" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round" />
        {/* Süsler */}
        <circle cx="14" cy="17" r="2.2" fill={`url(#${id}-gold)`} />
        <circle cx="38" cy="17" r="1.6" fill="#ef4444" />
        <path d="M20 26h5M19.5 29.5h5" stroke={`url(#${id}-gold)`} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M27 21q-1 5 3 6" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="1.4" strokeLinecap="round" />
        {/* Namlu ucu */}
        <rect x="55" y="11.5" width="4" height="5" rx="1" fill="#f97316" />
        {/* Su fışkırması */}
        <g className="team-pk-gun-flash">
          <path d="M59 14q4-1 5 0" stroke="#7dd3fc" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <circle cx="62.5" cy="10.5" r="1.3" fill="#bae6fd" />
          <circle cx="62" cy="18" r="1.1" fill="#bae6fd" />
        </g>
      </svg>
    </span>
  );
}