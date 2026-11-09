import { cn } from '@/lib/utils';

/**
 * Profil menüsü düğmesi: her düğme kendi renginde parlayan, hafif eğimli bir görsel kart.
 * Kartın köşesinde rengin büyük filigran ikonu durur; ikon ve etiket ortada toplanır.
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
      {/* Arkadaki renkli ışık */}
      <span aria-hidden="true" className={cn('pointer-events-none absolute -inset-[1px] rounded-[18px] opacity-70 blur-[6px]', t.neon)} />
      <span
        className={cn(
          'relative flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-[1px] overflow-hidden rounded-[14px] border bg-gradient-to-br px-1 py-1 text-center',
          t.border,
          t.surface,
        )}
      >
        {/* Köşedeki büyük filigran ikon: kartın görsel dokusu */}
        <Icon aria-hidden="true" className="pointer-events-none absolute -right-1 -top-1 h-8 w-8 opacity-[0.16]" strokeWidth={1.6} />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

        <span
          aria-hidden="true"
          className="relative flex h-[20px] w-[20px] items-center justify-center rounded-full border border-white/40 bg-white/20 text-white shadow-[0_3px_10px_-4px_rgba(0,0,0,0.95)] backdrop-blur-sm"
        >
          <Icon className="h-[11px] w-[11px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]" strokeWidth={2.5} />
        </span>

        <span className="relative line-clamp-2 px-0.5 text-[7.5px] font-extrabold uppercase leading-[1.1] tracking-[0.01em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {label}
        </span>

        {(typeof value === 'number') && (
          <span className="relative rounded-full bg-black/45 px-1.5 py-[1px] text-[9.5px] font-bold leading-tight text-white tabular-nums">
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

// Renk tonları: neon ışık ve kart yüzeyi (renk → koyu geçiş).
const TONES = {
  sky: { neon: 'bg-sky-500/70', surface: 'from-sky-400/80 via-sky-600/45 to-[#081020]', border: 'border-sky-200/55' },
  violet: { neon: 'bg-violet-500/70', surface: 'from-violet-400/80 via-violet-600/45 to-[#100820]', border: 'border-violet-200/55' },
  pink: { neon: 'bg-pink-500/70', surface: 'from-pink-400/80 via-pink-600/45 to-[#1c0812]', border: 'border-pink-200/55' },
  cyan: { neon: 'bg-cyan-500/70', surface: 'from-cyan-400/80 via-cyan-600/45 to-[#06141a]', border: 'border-cyan-200/55' },
  amber: { neon: 'bg-amber-500/75', surface: 'from-amber-300/85 via-amber-500/50 to-[#1d1405]', border: 'border-amber-200/60' },
  rose: { neon: 'bg-rose-500/70', surface: 'from-rose-400/80 via-rose-600/45 to-[#1c060c]', border: 'border-rose-200/55' },
  purple: { neon: 'bg-purple-500/70', surface: 'from-purple-400/80 via-purple-600/45 to-[#120820]', border: 'border-purple-200/55' },
  emerald: { neon: 'bg-emerald-500/70', surface: 'from-emerald-400/80 via-emerald-600/45 to-[#06170f]', border: 'border-emerald-200/55' },
  indigo: { neon: 'bg-indigo-500/70', surface: 'from-indigo-400/80 via-indigo-600/45 to-[#0a0c22]', border: 'border-indigo-200/55' },
  teal: { neon: 'bg-teal-500/70', surface: 'from-teal-400/80 via-teal-600/45 to-[#061818]', border: 'border-teal-200/55' },
  slate: { neon: 'bg-slate-400/60', surface: 'from-slate-400/70 via-slate-600/45 to-[#0c0e14]', border: 'border-slate-200/45' },
  red: { neon: 'bg-red-500/75', surface: 'from-red-400/80 via-red-600/45 to-[#1c0606]', border: 'border-red-200/60' },
  blue: { neon: 'bg-blue-500/70', surface: 'from-blue-400/80 via-blue-600/45 to-[#060f22]', border: 'border-blue-200/55' },
  zinc: { neon: 'bg-zinc-400/55', surface: 'from-zinc-400/70 via-zinc-600/45 to-[#0c0c10]', border: 'border-zinc-200/45' },
};