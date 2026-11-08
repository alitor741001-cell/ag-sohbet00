import { cn } from '@/lib/utils';

/**
 * Profil menüsü düğmesi: koyu cam kart, renkli ışıltılı ikon, altında etiket.
 * Kart kendi renginde parlar; değeri olan düğmeler altta küçük bir rozet gösterir.
 */
export default function ProfileMenuTile({ label, Icon, tone = 'sky', value, unread = 0, onClick }) {
  const t = TONES[tone] || TONES.sky;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'group relative flex min-h-0 min-w-0 flex-col items-center justify-center gap-[3px] overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-b px-0.5 py-1 text-center shadow-[0_10px_20px_-16px_rgba(0,0,0,1)] transition active:scale-[0.95]',
        t.tile,
      )}
    >
      {/* Üstteki renkli ışıltı ve kartın iç çerçevesi */}
      <span aria-hidden="true" className={cn('pointer-events-none absolute -top-7 left-1/2 h-11 w-16 -translate-x-1/2 rounded-full blur-xl', t.glow)} />
      <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0 rounded-[16px] ring-1 ring-inset', t.ring)} />
      {/* Sol üstte ince ışık: cam yüzey */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

      <span
        aria-hidden="true"
        className={cn(
          'relative flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-gradient-to-br text-white shadow-[0_5px_12px_-6px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.45)]',
          t.icon,
        )}
      >
        <Icon className="h-[16px] w-[16px]" strokeWidth={2.4} />
      </span>

      <span className={cn('relative line-clamp-2 px-0.5 text-[8.5px] font-bold uppercase leading-[1.15] tracking-[0.03em] text-white/75', t.text)}>
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
          className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-none text-destructive-foreground ring-2 ring-black/60"
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}

// Renk tonları: kart zemini, ikon gradyanı, ışıltı ve değer rozeti.
const TONES = {
  sky: { tile: 'from-sky-500/22 to-white/[0.02]', ring: 'ring-sky-300/20', icon: 'from-sky-300 to-sky-600', glow: 'bg-sky-400/45', text: 'text-sky-50', badge: 'bg-sky-400/20 text-sky-100' },
  violet: { tile: 'from-violet-500/22 to-white/[0.02]', ring: 'ring-violet-300/20', icon: 'from-violet-300 to-violet-600', glow: 'bg-violet-400/45', text: 'text-violet-50', badge: 'bg-violet-400/20 text-violet-100' },
  pink: { tile: 'from-pink-500/22 to-white/[0.02]', ring: 'ring-pink-300/20', icon: 'from-pink-300 to-pink-600', glow: 'bg-pink-400/45', text: 'text-pink-50', badge: 'bg-pink-400/20 text-pink-100' },
  cyan: { tile: 'from-cyan-500/22 to-white/[0.02]', ring: 'ring-cyan-300/20', icon: 'from-cyan-300 to-cyan-600', glow: 'bg-cyan-400/45', text: 'text-cyan-50', badge: 'bg-cyan-400/20 text-cyan-100' },
  amber: { tile: 'from-amber-500/22 to-white/[0.02]', ring: 'ring-amber-300/25', icon: 'from-amber-200 to-amber-600', glow: 'bg-amber-300/45', text: 'text-amber-50', badge: 'bg-amber-400/20 text-amber-100' },
  rose: { tile: 'from-rose-500/22 to-white/[0.02]', ring: 'ring-rose-300/20', icon: 'from-rose-300 to-rose-600', glow: 'bg-rose-400/45', text: 'text-rose-50', badge: 'bg-rose-400/20 text-rose-100' },
  purple: { tile: 'from-purple-500/22 to-white/[0.02]', ring: 'ring-purple-300/20', icon: 'from-purple-300 to-purple-600', glow: 'bg-purple-400/45', text: 'text-purple-50', badge: 'bg-purple-400/20 text-purple-100' },
  emerald: { tile: 'from-emerald-500/22 to-white/[0.02]', ring: 'ring-emerald-300/20', icon: 'from-emerald-300 to-emerald-600', glow: 'bg-emerald-400/45', text: 'text-emerald-50', badge: 'bg-emerald-400/20 text-emerald-100' },
  indigo: { tile: 'from-indigo-500/22 to-white/[0.02]', ring: 'ring-indigo-300/20', icon: 'from-indigo-300 to-indigo-600', glow: 'bg-indigo-400/45', text: 'text-indigo-50', badge: 'bg-indigo-400/20 text-indigo-100' },
  teal: { tile: 'from-teal-500/22 to-white/[0.02]', ring: 'ring-teal-300/20', icon: 'from-teal-300 to-teal-600', glow: 'bg-teal-400/45', text: 'text-teal-50', badge: 'bg-teal-400/20 text-teal-100' },
  slate: { tile: 'from-slate-400/20 to-white/[0.02]', ring: 'ring-slate-300/20', icon: 'from-slate-200 to-slate-600', glow: 'bg-slate-300/40', text: 'text-slate-50', badge: 'bg-slate-400/20 text-slate-100' },
  red: { tile: 'from-red-500/22 to-white/[0.02]', ring: 'ring-red-300/20', icon: 'from-red-300 to-red-600', glow: 'bg-red-400/45', text: 'text-red-50', badge: 'bg-red-400/20 text-red-100' },
  blue: { tile: 'from-blue-500/22 to-white/[0.02]', ring: 'ring-blue-300/20', icon: 'from-blue-300 to-blue-600', glow: 'bg-blue-400/45', text: 'text-blue-50', badge: 'bg-blue-400/20 text-blue-100' },
  zinc: { tile: 'from-zinc-400/20 to-white/[0.02]', ring: 'ring-zinc-300/20', icon: 'from-zinc-200 to-zinc-600', glow: 'bg-zinc-300/40', text: 'text-zinc-50', badge: 'bg-zinc-400/20 text-zinc-100' },
};