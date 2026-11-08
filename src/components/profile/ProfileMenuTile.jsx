import { cn } from '@/lib/utils';

/**
 * Profil menüsü düğmesi: her düğme kendi renginde ateşli bir cam kart olarak yanar.
 * Arkada kendi renginde neon ışık, renkli ikon ve altında etiket bulunur.
 * Değeri olan düğmeler küçük bir rozet gösterir.
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
      <span aria-hidden="true" className={cn('pointer-events-none absolute -inset-[2px] rounded-[18px] opacity-80 blur-[7px]', t.neon)} />
      <span
        className={cn(
          'relative flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-[3px] overflow-hidden rounded-[16px] border bg-gradient-to-b px-0.5 py-1.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
          t.border,
          t.surface,
        )}
      >
        {/* Üstteki renkli ışıltı */}
        <span aria-hidden="true" className={cn('pointer-events-none absolute -top-6 left-1/2 h-10 w-14 -translate-x-1/2 rounded-full blur-xl', t.glow)} />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        <span
          aria-hidden="true"
          className={cn(
            'relative flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-gradient-to-br text-white shadow-[0_5px_12px_-6px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.45)]',
            t.icon,
          )}
        >
          <Icon className="h-[16px] w-[16px] drop-shadow-[0_0_6px_rgba(255,255,255,0.55)]" strokeWidth={2.4} />
        </span>

        <span className={cn('relative line-clamp-2 px-0.5 text-[8.5px] font-bold uppercase leading-[1.15] tracking-[0.03em] text-white/90', t.text)}>
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

// Renk tonları: neon ışık, kart yüzeyi, kenar, ikon gradyanı ve değer rozeti.
const TONES = {
  sky: { neon: 'bg-sky-500/50', surface: 'from-sky-500/30 to-[#081020]', border: 'border-sky-300/45', icon: 'from-sky-300 to-sky-600', glow: 'bg-sky-300/60', text: 'text-sky-50', badge: 'bg-sky-300/30 text-white' },
  violet: { neon: 'bg-violet-500/50', surface: 'from-violet-500/30 to-[#100820]', border: 'border-violet-300/45', icon: 'from-violet-300 to-violet-600', glow: 'bg-violet-300/60', text: 'text-violet-50', badge: 'bg-violet-300/30 text-white' },
  pink: { neon: 'bg-pink-500/50', surface: 'from-pink-500/30 to-[#1c0812]', border: 'border-pink-300/45', icon: 'from-pink-300 to-pink-600', glow: 'bg-pink-300/60', text: 'text-pink-50', badge: 'bg-pink-300/30 text-white' },
  cyan: { neon: 'bg-cyan-500/50', surface: 'from-cyan-500/30 to-[#06141a]', border: 'border-cyan-300/45', icon: 'from-cyan-300 to-cyan-600', glow: 'bg-cyan-300/60', text: 'text-cyan-50', badge: 'bg-cyan-300/30 text-white' },
  amber: { neon: 'bg-amber-500/55', surface: 'from-amber-500/32 to-[#1d1405]', border: 'border-amber-300/50', icon: 'from-amber-200 to-amber-600', glow: 'bg-amber-300/65', text: 'text-amber-50', badge: 'bg-amber-300/30 text-white' },
  rose: { neon: 'bg-rose-500/50', surface: 'from-rose-500/30 to-[#1c060c]', border: 'border-rose-300/45', icon: 'from-rose-300 to-rose-600', glow: 'bg-rose-300/60', text: 'text-rose-50', badge: 'bg-rose-300/30 text-white' },
  purple: { neon: 'bg-purple-500/50', surface: 'from-purple-500/30 to-[#120820]', border: 'border-purple-300/45', icon: 'from-purple-300 to-purple-600', glow: 'bg-purple-300/60', text: 'text-purple-50', badge: 'bg-purple-300/30 text-white' },
  emerald: { neon: 'bg-emerald-500/50', surface: 'from-emerald-500/30 to-[#06170f]', border: 'border-emerald-300/45', icon: 'from-emerald-300 to-emerald-600', glow: 'bg-emerald-300/60', text: 'text-emerald-50', badge: 'bg-emerald-300/30 text-white' },
  indigo: { neon: 'bg-indigo-500/50', surface: 'from-indigo-500/30 to-[#0a0c22]', border: 'border-indigo-300/45', icon: 'from-indigo-300 to-indigo-600', glow: 'bg-indigo-300/60', text: 'text-indigo-50', badge: 'bg-indigo-300/30 text-white' },
  teal: { neon: 'bg-teal-500/50', surface: 'from-teal-500/30 to-[#061818]', border: 'border-teal-300/45', icon: 'from-teal-300 to-teal-600', glow: 'bg-teal-300/60', text: 'text-teal-50', badge: 'bg-teal-300/30 text-white' },
  slate: { neon: 'bg-slate-400/45', surface: 'from-slate-500/28 to-[#0c0e14]', border: 'border-slate-300/35', icon: 'from-slate-200 to-slate-600', glow: 'bg-slate-200/55', text: 'text-slate-50', badge: 'bg-slate-300/25 text-white' },
  red: { neon: 'bg-red-500/55', surface: 'from-red-500/32 to-[#1c0606]', border: 'border-red-300/50', icon: 'from-red-300 to-red-600', glow: 'bg-red-300/65', text: 'text-red-50', badge: 'bg-red-300/30 text-white' },
  blue: { neon: 'bg-blue-500/50', surface: 'from-blue-500/30 to-[#060f22]', border: 'border-blue-300/45', icon: 'from-blue-300 to-blue-600', glow: 'bg-blue-300/60', text: 'text-blue-50', badge: 'bg-blue-300/30 text-white' },
  zinc: { neon: 'bg-zinc-400/40', surface: 'from-zinc-500/25 to-[#0c0c10]', border: 'border-zinc-300/35', icon: 'from-zinc-200 to-zinc-600', glow: 'bg-zinc-200/50', text: 'text-zinc-50', badge: 'bg-zinc-300/25 text-white' },
};