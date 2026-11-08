import { cn } from '@/lib/utils';

/**
 * Profil menüsü düğmesi: koyu cam kart, arkada kendi renginde neon ışık,
 * renkli ikon ve altında etiket. Değeri olan düğmeler küçük bir rozet gösterir.
 */
export default function ProfileMenuTile({ label, Icon, tone = 'sky', value, unread = 0, onClick }) {
  const t = TONES[tone] || TONES.sky;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex min-h-0 min-w-0 transition active:scale-[0.95]"
    >
      {/* Arkadaki neon ışık */}
      <span aria-hidden="true" className={cn('pointer-events-none absolute -inset-[2px] rounded-[18px] opacity-70 blur-[7px]', t.neon)} />
      <span
        className={cn(
          'relative flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-[3px] overflow-hidden rounded-[16px] border bg-[#0b0a12] px-0.5 py-1.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
          t.border,
        )}
      >
        {/* Üstteki renkli ışıltı */}
        <span aria-hidden="true" className={cn('pointer-events-none absolute -top-6 left-1/2 h-10 w-14 -translate-x-1/2 rounded-full blur-xl', t.glow)} />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

        <span
          aria-hidden="true"
          className={cn(
            'relative flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-gradient-to-br text-white shadow-[0_5px_12px_-6px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.45)]',
            t.icon,
          )}
        >
          <Icon className="h-[16px] w-[16px] drop-shadow-[0_0_6px_rgba(255,255,255,0.55)]" strokeWidth={2.4} />
        </span>

        <span className={cn('relative line-clamp-2 px-0.5 text-[8.5px] font-bold uppercase leading-[1.15] tracking-[0.03em] text-white/80', t.text)}>
          {label}
        </span>

        {(typeof value === 'number') && (
          <span className={cn('relative rounded-full px-1.5 py-[1px] text-[10px] font-bold leading-tight tabular-nums', t.badge)}>
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
      </span>
    </button>
  );
}

// Renk tonları: neon ışık, kart kenarı, ikon gradyanı ve değer rozeti.
const TONES = {
  sky: { neon: 'bg-sky-500/45', border: 'border-sky-400/30', icon: 'from-sky-300 to-sky-600', glow: 'bg-sky-400/50', text: 'text-sky-50', badge: 'bg-sky-400/20 text-sky-100' },
  violet: { neon: 'bg-violet-500/45', border: 'border-violet-400/30', icon: 'from-violet-300 to-violet-600', glow: 'bg-violet-400/50', text: 'text-violet-50', badge: 'bg-violet-400/20 text-violet-100' },
  pink: { neon: 'bg-pink-500/45', border: 'border-pink-400/30', icon: 'from-pink-300 to-pink-600', glow: 'bg-pink-400/50', text: 'text-pink-50', badge: 'bg-pink-400/20 text-pink-100' },
  cyan: { neon: 'bg-cyan-500/45', border: 'border-cyan-400/30', icon: 'from-cyan-300 to-cyan-600', glow: 'bg-cyan-400/50', text: 'text-cyan-50', badge: 'bg-cyan-400/20 text-cyan-100' },
  amber: { neon: 'bg-amber-500/45', border: 'border-amber-400/30', icon: 'from-amber-200 to-amber-600', glow: 'bg-amber-300/50', text: 'text-amber-50', badge: 'bg-amber-400/20 text-amber-100' },
  rose: { neon: 'bg-rose-500/45', border: 'border-rose-400/30', icon: 'from-rose-300 to-rose-600', glow: 'bg-rose-400/50', text: 'text-rose-50', badge: 'bg-rose-400/20 text-rose-100' },
  purple: { neon: 'bg-purple-500/45', border: 'border-purple-400/30', icon: 'from-purple-300 to-purple-600', glow: 'bg-purple-400/50', text: 'text-purple-50', badge: 'bg-purple-400/20 text-purple-100' },
  emerald: { neon: 'bg-emerald-500/45', border: 'border-emerald-400/30', icon: 'from-emerald-300 to-emerald-600', glow: 'bg-emerald-400/50', text: 'text-emerald-50', badge: 'bg-emerald-400/20 text-emerald-100' },
  indigo: { neon: 'bg-indigo-500/45', border: 'border-indigo-400/30', icon: 'from-indigo-300 to-indigo-600', glow: 'bg-indigo-400/50', text: 'text-indigo-50', badge: 'bg-indigo-400/20 text-indigo-100' },
  teal: { neon: 'bg-teal-500/45', border: 'border-teal-400/30', icon: 'from-teal-300 to-teal-600', glow: 'bg-teal-400/50', text: 'text-teal-50', badge: 'bg-teal-400/20 text-teal-100' },
  slate: { neon: 'bg-slate-400/40', border: 'border-slate-300/25', icon: 'from-slate-200 to-slate-600', glow: 'bg-slate-300/45', text: 'text-slate-50', badge: 'bg-slate-400/20 text-slate-100' },
  red: { neon: 'bg-red-500/50', border: 'border-red-400/35', icon: 'from-red-300 to-red-600', glow: 'bg-red-400/50', text: 'text-red-50', badge: 'bg-red-400/20 text-red-100' },
  blue: { neon: 'bg-blue-500/45', border: 'border-blue-400/30', icon: 'from-blue-300 to-blue-600', glow: 'bg-blue-400/50', text: 'text-blue-50', badge: 'bg-blue-400/20 text-blue-100' },
  zinc: { neon: 'bg-zinc-400/35', border: 'border-zinc-300/25', icon: 'from-zinc-200 to-zinc-600', glow: 'bg-zinc-300/45', text: 'text-zinc-50', badge: 'bg-zinc-400/20 text-zinc-100' },
};