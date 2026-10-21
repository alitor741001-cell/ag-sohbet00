import { crystalSkin, GOLD_LINE } from '@/components/profile/crystal/crystalTheme';

function Diamond({ tone = 'blue', flip = false }) {
  const c = crystalSkin(tone);
  return (
    <span
      className="relative inline-flex h-[11px] w-[11px] shrink-0 rotate-45 items-center justify-center rounded-[2px]"
      style={{ background: GOLD_LINE, boxShadow: `0 0 10px -1px ${c.glow}, inset 0 0 4px rgba(255,255,255,0.7)` }}
    >
      <span
        className="h-[5px] w-[5px] rounded-[1px]"
        style={{ background: flip ? c.blue : '#0a2b57', boxShadow: `0 0 6px ${c.blue}` }}
      />
    </span>
  );
}

/**
 * Referansın kimlik bölümü: ortada büyük, parlak rol başlığı (ADMIN) ve iki yanında
 * altın-mavi elmas süslemeleri; üstünde kullanıcının adı.
 */
export default function CrystalNameBlock({ name, roleLabel = '', tone = 'blue' }) {
  const c = crystalSkin(tone);

  return (
    <div className="mt-[5px]">
      <p
        className="truncate text-center text-[12px] font-black uppercase leading-none tracking-[0.08em]"
        style={{
          background: 'linear-gradient(180deg, #f4fbff 0%, #b6e4ff 36%, #64b8f6 70%, #1d5ea8 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          filter: `drop-shadow(0 0 8px ${c.glow})`,
        }}
      >
        {name}
      </p>

      <div className="mt-[3px] flex items-center justify-center gap-[7px]">
        <Diamond tone={tone} />
        <span
          className="max-w-[210px] truncate text-center text-[25px] font-black uppercase leading-none tracking-[0.04em]"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: '#ffffff',
            textShadow: `0 0 10px ${c.glow}, 0 0 26px ${c.glow}, 0 2px 5px rgba(0,0,0,0.9)`,
          }}
        >
          {roleLabel || 'ÜYE'}
        </span>
        <Diamond tone={tone} flip />
      </div>
    </div>
  );
}