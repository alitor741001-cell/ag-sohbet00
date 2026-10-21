import { Cake, CalendarDays, Check, Copy, MapPin } from 'lucide-react';

/** Kimlik şeridi: cinsiyet + yaş, ülke, kopyalanabilir üye numarası ve kayıt tarihi. */
export default function ProfileIdentityBlock({ palette, genderLabel, age, country, flag, memberId, joinDate, copied, onCopyId }) {
  return (
    <div className="mt-5 space-y-3">
      <div
        className="flex items-center justify-between rounded-2xl border-2 px-4 py-2.5"
        style={{ borderColor: palette.accent, background: 'rgba(0,0,0,0.45)', boxShadow: `0 0 18px -4px ${palette.glow}` }}
      >
        <span className="flex items-center gap-2 text-sm font-bold" style={{ color: palette.accent }}>
          <span className="text-base">{palette.symbol}</span>
          {genderLabel}
        </span>
        <span className="flex items-center gap-2 text-sm font-bold text-white">
          <Cake className="h-4 w-4" style={{ color: palette.accent2 }} />
          {age === null ? 'Belirtilmedi' : `${age} Yaş`}
        </span>
      </div>

      {country && (
        <div className="flex items-center justify-between rounded-2xl border px-4 py-2.5" style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.5)' }}>
          <span className="flex items-center gap-2 text-xs font-semibold text-white/70">
            <MapPin className="h-4 w-4" style={{ color: palette.accent2 }} />
            Ülke
          </span>
          <span className="flex items-center gap-1.5 text-sm font-bold text-white">
            <span className="text-base">{flag}</span> {country}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl border px-4 py-2.5" style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.5)' }}>
        <span className="font-mono text-base font-bold text-white"># {memberId || '-'}</span>
        <button
          type="button"
          onClick={onCopyId}
          disabled={!memberId}
          aria-label="Kimliği kopyala"
          className="flex h-8 w-8 items-center justify-center rounded-full border disabled:opacity-40"
          style={{ borderColor: palette.accent, color: palette.accent }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-center justify-between rounded-2xl border px-4 py-2.5" style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.5)' }}>
        <span className="flex items-center gap-2 text-xs font-semibold text-white/70">
          <CalendarDays className="h-4 w-4" style={{ color: palette.accent2 }} />
          Kayıt Tarihi
        </span>
        <span className="text-sm font-bold text-white">{joinDate}</span>
      </div>
    </div>
  );
}