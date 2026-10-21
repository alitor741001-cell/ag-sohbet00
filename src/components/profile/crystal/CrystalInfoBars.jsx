import { CalendarDays, Check, ChevronRight, Copy, Lock } from 'lucide-react';
import CrystalCorners from '@/components/profile/crystal/CrystalCorners';
import { crystalSkin } from '@/components/profile/crystal/crystalTheme';

const ROW = 'relative flex items-center gap-1.5 rounded-[10px] border px-2.5';

/** Referanstaki bilgi barları: altın köşe çerçeveli kayıt tarihi satırı ve kilitli geniş bar. */
export default function CrystalInfoBars({
  joinDate = '', memberId = '', copied = false, onCopyId, country = '', flag = '', tone = 'blue',
}) {
  const c = crystalSkin(tone);
  const rowStyle = {
    borderColor: c.blueEdge,
    background: c.glass,
    boxShadow: `inset 0 0 18px -9px ${c.glow}, 0 0 12px -9px ${c.glow}`,
  };

  return (
    <div className="mt-2 space-y-[6px]">
      <div className={`${ROW} h-[30px]`} style={rowStyle}>
        <CrystalCorners />
        <CalendarDays className="h-[12px] w-[12px] shrink-0" style={{ color: c.gold }} strokeWidth={2.2} />
        <span className="text-[10px] font-bold text-white/85">Kayıt Tarihi</span>
        <span className="ml-auto text-[10.5px] font-black text-white">{joinDate || '—'}</span>
      </div>

      <div className={`${ROW} h-[28px]`} style={rowStyle}>
        <CrystalCorners />
        <Lock className="h-[11px] w-[11px] shrink-0" style={{ color: c.gold }} strokeWidth={2.2} />
        <span className="font-mono text-[10px] font-black tracking-wide text-white">ID: {memberId || '—'}</span>
        {country && <span className="truncate text-[9.5px] font-semibold text-white/65">{flag} {country}</span>}
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
        <ChevronRight className="h-[13px] w-[13px] shrink-0" style={{ color: c.blue }} />
      </div>
    </div>
  );
}