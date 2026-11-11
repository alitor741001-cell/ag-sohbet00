import { cn } from '@/lib/utils';

/**
 * Profil menüsü düğmesi: kompakt koyu cam kart. Üstte kendi renginde parlayan ikon küresi,
 * altında etiket ve varsa sayı; kartın alt kenarında rengin ince ışık çizgisi durur.
 */
export default function ProfileMenuTile({ label, Icon, tone = 'sky', value, unread = 0, onClick }) {
  const t = TONES[tone] || TONES.sky;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'group relative flex h-[64px] min-w-0 flex-col items-center justify-center gap-[3px] overflow-hidden rounded-2xl border bg-gradient-to-b from-white/[0.09] to-black/60 px-1 text-center shadow-[0_6px_14px_-8px_rgba(0,0,0,0.9)] backdrop-blur-md transition active:scale-[0.94]',
        t.border,
      )}
    >
      {/* Arkadaki renk ışığı ve alttaki ince neon çizgi */}
      <span aria-hidden="true" className={cn('pointer-events-none absolute -top-6 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full opacity-60 blur-xl', t.glow)} />
      <span aria-hidden="true" className={cn('pointer-events-none absolute inset-x-3 bottom-0 h-[2px] rounded-full', t.line)} />

      <span
        aria-hidden="true"
        className={cn('relative flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gradient-to-br text-white ring-1 ring-white/40', t.orb)}
      >
        <Icon className="h-[14px] w-[14px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" strokeWidth={2.4} />
      </span>

      <span className="relative line-clamp-1 w-full px-0.5 text-[8.5px] font-bold leading-tight tracking-wide text-white/90">
        {label}
      </span>

      {(typeof value === 'number') && (
        <span className="relative text-[9.5px] font-black leading-none text-white tabular-nums">
          {value.toLocaleString('tr-TR')}
        </span>
      )}

      {unread > 0 && (
        <span
          aria-label={`${unread} yeni ziyaretçi`}
          className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-none text-destructive-foreground shadow-[0_0_10px_rgba(239,68,68,0.9)] ring-2 ring-black/60"
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}

// Renk tonları: ikon küresi, arka ışık, alt çizgi ve kenar.
const TONES = {
  sky: { orb: 'from-sky-300 to-sky-600 shadow-[0_0_12px_rgba(56,189,248,0.8)]', glow: 'bg-sky-500', line: 'bg-sky-400', border: 'border-sky-300/25' },
  violet: { orb: 'from-violet-300 to-violet-600 shadow-[0_0_12px_rgba(139,92,246,0.8)]', glow: 'bg-violet-500', line: 'bg-violet-400', border: 'border-violet-300/25' },
  pink: { orb: 'from-pink-300 to-pink-600 shadow-[0_0_12px_rgba(236,72,153,0.8)]', glow: 'bg-pink-500', line: 'bg-pink-400', border: 'border-pink-300/25' },
  cyan: { orb: 'from-cyan-300 to-cyan-600 shadow-[0_0_12px_rgba(34,211,238,0.8)]', glow: 'bg-cyan-500', line: 'bg-cyan-400', border: 'border-cyan-300/25' },
  amber: { orb: 'from-amber-200 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.85)]', glow: 'bg-amber-500', line: 'bg-amber-400', border: 'border-amber-300/30' },
  rose: { orb: 'from-rose-300 to-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.8)]', glow: 'bg-rose-500', line: 'bg-rose-400', border: 'border-rose-300/25' },
  purple: { orb: 'from-purple-300 to-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.8)]', glow: 'bg-purple-500', line: 'bg-purple-400', border: 'border-purple-300/25' },
  emerald: { orb: 'from-emerald-300 to-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.8)]', glow: 'bg-emerald-500', line: 'bg-emerald-400', border: 'border-emerald-300/25' },
  indigo: { orb: 'from-indigo-300 to-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.8)]', glow: 'bg-indigo-500', line: 'bg-indigo-400', border: 'border-indigo-300/25' },
  teal: { orb: 'from-teal-300 to-teal-600 shadow-[0_0_12px_rgba(20,184,166,0.8)]', glow: 'bg-teal-500', line: 'bg-teal-400', border: 'border-teal-300/25' },
  slate: { orb: 'from-slate-300 to-slate-600 shadow-[0_0_12px_rgba(148,163,184,0.7)]', glow: 'bg-slate-400', line: 'bg-slate-300', border: 'border-slate-300/25' },
  red: { orb: 'from-red-300 to-red-600 shadow-[0_0_12px_rgba(239,68,68,0.85)]', glow: 'bg-red-500', line: 'bg-red-400', border: 'border-red-300/30' },
  blue: { orb: 'from-blue-300 to-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.8)]', glow: 'bg-blue-500', line: 'bg-blue-400', border: 'border-blue-300/25' },
  zinc: { orb: 'from-zinc-300 to-zinc-600 shadow-[0_0_12px_rgba(161,161,170,0.7)]', glow: 'bg-zinc-400', line: 'bg-zinc-300', border: 'border-zinc-300/25' },
};