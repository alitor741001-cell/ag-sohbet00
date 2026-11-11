/** Önde olan takımın profillerinin üstündeki silah: rakibe döner, her 5 saniyede bir geri teper. */
export default function TeamPkGun({ side }) {
  const flip = side === 'red';
  return (
    <span className={`team-pk-gun pointer-events-none absolute -top-1.5 z-20 ${flip ? '-left-1' : '-right-1'}`} style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <svg viewBox="0 0 32 20" className="h-4 w-6" aria-hidden="true">
        <path d="M2 4h22l2-2h4v5h-4l-1 2H14l-2 2h-1l-2 8H4l2-8H2z" fill="#1f2937" stroke="#fbbf24" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="30.5" cy="4.5" r="1.4" className="team-pk-gun-flash" fill="#fde68a" />
      </svg>
    </span>
  );
}