export default function CallCircleButton({ onClick, label, tone = 'gray', pulsing, children }) {
  const tones = {
    green: 'bg-green-500 active:bg-green-600 shadow-[0_0_34px_-4px_rgba(34,197,94,0.9)]',
    red: 'bg-red-600 active:bg-red-700 shadow-[0_0_34px_-4px_rgba(239,68,68,0.9)]',
    gray: 'bg-white/15 active:bg-white/25',
  };
  const rings = { green: 'bg-green-500/40', red: 'bg-red-500/40' };

  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={onClick} aria-label={label} className={`relative flex h-[74px] w-[74px] items-center justify-center rounded-full text-white transition-transform active:scale-95 ${tones[tone] || tones.gray}`}>
        {pulsing && <span className={`absolute inset-0 rounded-full animate-ping ${rings[tone] || 'bg-white/30'}`} />}
        <span className="relative">{children}</span>
      </button>
      <span className="text-xs text-white/70">{label}</span>
    </div>
  );
}