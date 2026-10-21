import { Check, Coins, Copy, Heart } from 'lucide-react';
import CompactCrystalAvatar from '@/components/profile/compact/CompactCrystalAvatar';
import { vipStyle } from '@/lib/userLevels';

/**
 * Kompakt kartın kimlik bölümü: iki koltuk boyunda kristal fotoğraf, elmaslarla çevrili
 * isim, pembe cinsiyet rozeti, ajans etiketi, kimlik satırı ve VIP/kalp sayacı.
 */
export default function CompactProfileHero({
  name, avatar, palette, hidden = false, statusLabel = '', roleLabel = '',
  genderLabel, age, country, flag, memberId, copied, onCopyId,
  level = 0, vipLevel = 0, receivedLevel = 0, tags = [],
}) {
  const vip = vipLevel > 0 ? vipStyle(vipLevel) : null;

  return (
    <div className="flex flex-col items-center">
      <CompactCrystalAvatar avatar={avatar} name={name} vipLevel={hidden ? 0 : vipLevel} />

      {statusLabel && <p className="mt-2 text-[10px] font-black tracking-[0.3em] text-destructive">{statusLabel}</p>}

      <div className="mt-2 flex w-full items-center justify-center gap-2">
        <span aria-hidden className="h-2 w-2 shrink-0 rotate-45 border border-[#bfe9ff]/80 bg-[#2a5c86]" />
        <p
          className="max-w-[70%] break-words text-center text-[22px] font-black leading-tight text-white"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', textShadow: `0 0 12px ${palette.glow}` }}
        >
          {name}
        </p>
        <span aria-hidden className="h-2 w-2 shrink-0 rotate-45 border border-[#bfe9ff]/80 bg-[#2a5c86]" />
      </div>
      {roleLabel && <p className="mt-0.5 max-w-full truncate text-[10px] font-bold" style={{ color: palette.accent2 }}>{roleLabel}</p>}

      {/* Cinsiyet + yaş, ajans ve yayıncı etiketleri. */}
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1">
        <span
          className="flex items-center gap-1 rounded-full border px-[7px] py-[2px] text-[10px] font-black"
          style={{
            borderColor: '#e5c05a',
            color: '#fff0f6',
            background: 'linear-gradient(160deg, #f7a8c8, #d15b8d)',
            boxShadow: '0 0 12px -4px rgba(244,143,177,0.9)',
          }}
        >
          {palette.symbol} {age === null || age === undefined ? genderLabel : age}
        </span>
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border px-2 py-[2px] text-[9.5px] font-black text-white"
            style={{ borderColor: 'rgba(168,216,245,0.7)', background: 'rgba(35,86,133,0.85)' }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Kimlik ve ülke satırı. */}
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] font-semibold text-white/75">
        <span className="flex items-center gap-1">
          <span className="font-mono text-[11px] font-bold text-white">ID:{memberId || '-'}</span>
          <button
            type="button"
            onClick={onCopyId}
            disabled={!memberId}
            aria-label="Kimliği kopyala"
            className="flex h-5 w-5 items-center justify-center rounded-full border disabled:opacity-40"
            style={{ borderColor: palette.accent, color: palette.accent }}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </button>
        </span>
        {country && <span className="flex items-center gap-1"><span className="text-[12px]">{flag}</span>{country}</span>}
      </div>

      {/* VIP ve hediye sayacı: referanstaki altın para / kalp satırı. */}
      <div className="mt-1.5 flex items-center justify-center gap-1.5">
        {vip && !hidden && (
          <span
            className="rounded-md border px-1.5 py-[1px] text-[9px] font-black tracking-wide"
            style={{ borderColor: vip.border, background: vip.background, color: vip.color }}
          >
            VIP{vipLevel}
          </span>
        )}
        <span className="flex items-center gap-1 rounded-md border px-1.5 py-[1px] text-[10px] font-black tabular-nums text-white" style={{ borderColor: 'rgba(212,175,55,0.6)', background: 'rgba(0,0,0,0.45)' }}>
          <Coins className="h-3 w-3" style={{ color: '#f4d03f' }} /> {level}
        </span>
        <span className="flex items-center gap-1 rounded-md border px-1.5 py-[1px] text-[10px] font-black tabular-nums text-white" style={{ borderColor: 'rgba(240,107,168,0.7)', background: 'rgba(0,0,0,0.45)' }}>
          <Heart className="h-3 w-3" fill="#f06ba8" style={{ color: '#f06ba8' }} /> {receivedLevel}
        </span>
      </div>
    </div>
  );
}