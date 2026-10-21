import { Cake, CalendarDays, Check, Copy, MapPin } from 'lucide-react';

/** Kompakt kimlik şeridi: cinsiyet + yaş, ülke, kopyalanabilir kimlik ve kayıt tarihi iki sütunda. */
export default function ProfileIdentityBlock({ palette, genderLabel, age, country, flag, memberId, joinDate, copied, onCopyId }) {
  const chip = 'flex items-center justify-between gap-1 rounded-xl border px-2 py-1 text-[10px] font-bold';

  return (
    <div className="grid grid-cols-2 gap-1.5">
      <div
        className={chip}
        style={{ borderColor: palette.accent, background: 'rgba(0,0,0,0.45)', boxShadow: `0 0 14px -6px ${palette.glow}` }}
      >
        <span className="flex items-center gap-1 truncate" style={{ color: palette.accent }}>
          <span className="text-[11px]">{palette.symbol}</span>
          {genderLabel}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-white">
          <Cake className="h-3 w-3" style={{ color: palette.accent2 }} />
          {age === null ? '—' : `${age}`}
        </span>
      </div>

      {country && (
        <div className={chip} style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.5)' }}>
          <span className="flex items-center gap-1 text-white/60">
            <MapPin className="h-3 w-3" style={{ color: palette.accent2 }} />
            Ülke
          </span>
          <span className="flex shrink-0 items-center gap-1 truncate text-white">
            <span className="text-[11px]">{flag}</span> {country}
          </span>
        </div>
      )}

      <div className={`${chip} ${country ? '' : 'col-span-2'}`} style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.5)' }}>
        <span className="truncate font-mono text-[11px] text-white"># {memberId || '-'}</span>
        <button
          type="button"
          onClick={onCopyId}
          disabled={!memberId}
          aria-label="Kimliği kopyala"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border disabled:opacity-40"
          style={{ borderColor: palette.accent, color: palette.accent }}
        >
          {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
        </button>
      </div>

      <div className={chip} style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.5)' }}>
        <span className="flex items-center gap-1 truncate text-white/60">
          <CalendarDays className="h-3 w-3" style={{ color: palette.accent2 }} />
          Kayıt
        </span>
        <span className="shrink-0 text-white">{joinDate}</span>
      </div>
    </div>
  );
}