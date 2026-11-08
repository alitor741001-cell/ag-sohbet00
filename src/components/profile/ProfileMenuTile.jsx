import { cn } from '@/lib/utils';

// Profil menüsü düğmesi: cam yüzeyli kart, renkli ikon rozeti ve etiket.
export default function ProfileMenuTile({ label, Icon, tone = 'sky', value, unread = 0, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex min-h-0 min-w-0 flex-col items-center justify-center gap-[3px] overflow-hidden rounded-[18px] border border-white/10 bg-gradient-to-b from-white/[0.10] to-white/[0.02] px-1 py-1.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_8px_16px_-12px_rgba(0,0,0,0.9)] transition active:scale-95"
    >
      <span aria-hidden="true" className={cn('pointer-events-none absolute inset-x-2 -top-5 h-9 rounded-full opacity-60 blur-xl', TONES[tone].glow)} />
      <span
        aria-hidden="true"
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-[11px] border border-white/20 bg-gradient-to-br text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]',
          TONES[tone].chip,
        )}
      >
        <Icon className="h-[17px] w-[17px]" strokeWidth={2.3} />
      </span>
      <span className="relative line-clamp-2 text-[9px] font-semibold leading-[1.15] tracking-tight text-white/85">{label}</span>
      {(typeof value === 'number') && (
        <span className="relative text-[11px] font-bold leading-none tabular-nums text-white">{value.toLocaleString('tr-TR')}</span>
      )}
      {unread > 0 && (
        <span
          aria-label={`${unread} yeni ziyaretçi`}
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-none text-destructive-foreground ring-2 ring-black/60"
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}

// Renk tonları: ikon rozetinin gradyanı ve üstündeki ışıltı.
const TONES = {
  sky: { chip: 'from-sky-400 to-sky-700', glow: 'bg-sky-400/45' },
  violet: { chip: 'from-violet-400 to-violet-700', glow: 'bg-violet-400/45' },
  pink: { chip: 'from-pink-400 to-pink-700', glow: 'bg-pink-400/45' },
  cyan: { chip: 'from-cyan-400 to-cyan-700', glow: 'bg-cyan-400/45' },
  amber: { chip: 'from-amber-300 to-amber-600', glow: 'bg-amber-300/45' },
  rose: { chip: 'from-rose-400 to-rose-700', glow: 'bg-rose-400/45' },
  purple: { chip: 'from-purple-400 to-purple-700', glow: 'bg-purple-400/45' },
  emerald: { chip: 'from-emerald-400 to-emerald-700', glow: 'bg-emerald-400/45' },
  indigo: { chip: 'from-indigo-400 to-indigo-700', glow: 'bg-indigo-400/45' },
  teal: { chip: 'from-teal-400 to-teal-700', glow: 'bg-teal-400/45' },
  slate: { chip: 'from-slate-300 to-slate-600', glow: 'bg-slate-300/40' },
  red: { chip: 'from-red-400 to-red-700', glow: 'bg-red-400/45' },
  blue: { chip: 'from-blue-400 to-blue-700', glow: 'bg-blue-400/45' },
  zinc: { chip: 'from-zinc-300 to-zinc-600', glow: 'bg-zinc-300/40' },
};