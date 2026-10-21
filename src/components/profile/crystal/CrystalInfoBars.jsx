import { CalendarDays, Check, ChevronRight, Copy, Lock } from 'lucide-react';
import { crystalSkin } from '@/components/profile/crystal/crystalTheme';

/** Referanstaki bilgi barları: kayıt tarihi satırı ve kilit ikonlu ince kimlik satırı. */
export default function CrystalInfoBars({
  joinDate = '', memberId = '', copied = false, onCopyId, country = '', flag = '', tone = 'blue',
}) {
  const c = crystalSkin(tone);
  const bar = { borderColor: c.edgeSoft, background: c.glass, boxShadow: `inset 0 0 14px -8px ${c.glow}` };

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex h-[26px] items-center gap-1.5 rounded-full border px-2.5" style={bar}>
        <CalendarDays className="h-[12px] w-[12px] shrink-0" style={{ color: c.gold }} strokeWidth={2.2} />
        <span className="text-[10px] font-bold text-white/85">Kayıt Tarihi</span>
        <span className="ml-auto text-[10.5px] font-black text-white">{joinDate || '—'}</span>
      </div>

      <div className="flex h-[24px] items-center gap-1.5 rounded-full border px-2.5" style={bar}>
        <Lock className="h-[11px] w-[11px] shrink-0" style={{ color: c.gold }} strokeWidth={2.2} />
        <span className="font-mono text-[10px] font-black tracking-wide text-white">ID: {memberId || '—'}</span>
        {country && (
          <span className="truncate text-[9.5px] font-semibold text-white/65">{flag} {country}</span>
        )}
        <button
          type="button"
          onClick={onCopyId}
          disabled={!memberId}
          aria-label="Kimliği kopyala"
          className="ml-auto flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full border disabled:opacity-35"
          style={{ borderColor: c.edge, color: c.gold }}
        >
          {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
        </button>
        <ChevronRight className="h-3 w-3 shrink-0" style={{ color: c.edge }} />
      </div>
    </div>
  );
}