import { Check, Coins, Copy, Heart } from 'lucide-react';
import CompactCrystalAvatar from '@/components/profile/compact/CompactCrystalAvatar';
import { compactTone } from '@/components/profile/compact/compactTheme';
import { vipStyle } from '@/lib/userLevels';

/**
 * Kompakt kartın kimlik bölümü (referans görsel): kristal kanatlı fotoğraf, iki elmas
 * arasında isim, cinsiyet/yaş rozeti, ajans amblemi, kimlik-ülke satırı ve sayaçlar.
 */
export default function CompactProfileHero({
  name, avatar, palette, hidden = false, statusLabel = '', roleLabel = '',
  genderLabel, age, country, flag, memberId, copied, onCopyId, agency = null,
  tone = 'pink', level = 0, vipLevel = 0, receivedLevel = 0, tags = [],
}) {
  const c = compactTone(tone);
  const vip = vipLevel > 0 ? vipStyle(vipLevel) : null;
  const initials = (agency?.name || '').trim().slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center">
      <CompactCrystalAvatar avatar={avatar} name={name} vipLevel={hidden ? 0 : vipLevel} tone={tone} />

      {statusLabel && <p className="mt-2 text-[10px] font-black tracking-[0.3em] text-destructive">{statusLabel}</p>}

      {/* İsim: iki yanında kristal elmas. */}
      <div className="mt-2 flex w-full items-center justify-center gap-2">
        <span aria-hidden className="h-[7px] w-[7px] shrink-0 rotate-45 rounded-[1px]" style={{ background: c.crystal, boxShadow: `0 0 8px ${c.mid}` }} />
        <p
          className="max-w-[68%] break-words text-center text-[21px] font-black leading-tight tracking-wide text-white"
          style={{ textShadow: `0 0 14px ${c.soft}` }}
        >
          {name}
        </p>
        <span aria-hidden className="h-[7px] w-[7px] shrink-0 rotate-45 rounded-[1px]" style={{ background: c.crystal, boxShadow: `0 0 8px ${c.mid}` }} />
      </div>
      {roleLabel && <p className="mt-0.5 max-w-full truncate text-[10px] font-bold" style={{ color: c.label }}>{roleLabel}</p>}

      {/* Cinsiyet + yaş rozeti ve ajans amblemi. */}
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
        <span
          className="flex items-center gap-1 rounded-full border px-2 py-[2px] text-[10px] font-black text-white"
          style={{ borderColor: c.genderBorder, background: c.genderBg, boxShadow: `0 0 12px -4px ${c.mid}` }}
        >
          {palette?.symbol || '♀'} {age === null || age === undefined ? genderLabel : age}
        </span>
        {agency && (
          <span
            className="flex items-center gap-1 rounded-full border py-[2px] pl-[2px] pr-2 text-[9.5px] font-black text-white"
            style={{ borderColor: c.edge, background: 'rgba(255,255,255,0.08)' }}
          >
            <span
              className="flex h-[15px] w-[15px] items-center justify-center rounded-full text-[6.5px] font-black"
              style={{ background: c.crystal, color: '#0b1220' }}
            >
              {initials}
            </span>
            {agency.name}
          </span>
        )}
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border px-2 py-[2px] text-[9.5px] font-black text-white"
            style={{ borderColor: c.edge, background: 'rgba(255,255,255,0.08)' }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Kimlik ve ülke satırı. */}
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] font-semibold text-white/80">
        <span className="flex items-center gap-1">
          <span className="font-mono text-[11px] font-bold text-white">ID:{memberId || '-'}</span>
          <button
            type="button"
            onClick={onCopyId}
            disabled={!memberId}
            aria-label="Kimliği kopyala"
            className="flex h-[17px] w-[17px] items-center justify-center rounded-full border disabled:opacity-40"
            style={{ borderColor: c.edge, color: c.label }}
          >
            {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
          </button>
        </span>
        {country && <span className="flex items-center gap-1"><span className="text-[12px] leading-none">{flag}</span>{country}</span>}
      </div>

      {/* Sayaçlar: VIP, altın para ve kalp. */}
      <div className="mt-1.5 flex items-center justify-center gap-2.5">
        {vip && !hidden && (
          <span
            className="rounded-md px-1.5 py-[1px] text-[9px] font-black tracking-wide"
            style={{ background: c.crystal, color: '#0b1220', boxShadow: `0 0 10px -4px ${c.mid}` }}
          >
            VIP{vipLevel}
          </span>
        )}
        <span className="flex items-center gap-1 text-[10.5px] font-black tabular-nums text-white">
          <Coins className="h-3.5 w-3.5" style={{ color: '#f4d03f' }} /> {level}
        </span>
        <span className="flex items-center gap-1 text-[10.5px] font-black tabular-nums text-white">
          <Heart className="h-3.5 w-3.5" fill={c.heart} style={{ color: c.heart }} /> {receivedLevel}
        </span>
      </div>
    </div>
  );
}