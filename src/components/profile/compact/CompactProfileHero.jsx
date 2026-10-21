import { CalendarDays, Check, Copy, Heart, Shield, Star } from 'lucide-react';
import ProfileFrame from '@/components/ProfileFrame';
import { receivedColor, vipStyle } from '@/lib/userLevels';

/**
 * Sesli odada açılan kompakt profil kartının üst bloğu: yuvarlak fotoğraf, VIP etiketi,
 * isim, cinsiyet/yaş, kimlik satırı ve rozetler — hepsi kaydırmadan tek ekrana sığacak boyutta.
 */
export default function CompactProfileHero({
  name, avatar, palette, hidden = false, statusLabel = '', roleLabel = '',
  genderLabel, age, country, flag, memberId, joinDate, copied, onCopyId,
  level = 0, nLevel = 0, vipLevel = 0, receivedLevel = 0, receivedTier, tags = [],
}) {
  const vip = vipLevel > 0 ? vipStyle(vipLevel) : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div
          className="rounded-full p-[2.5px]"
          style={{ background: `linear-gradient(180deg, ${palette.accent2}, ${palette.accent} 62%, ${palette.accent2})`, boxShadow: `0 0 26px -6px ${palette.glow}` }}
        >
          <div className="rounded-full bg-black/70 p-[3px]">
            <ProfileFrame avatar={avatar} name={name} size="xl" />
          </div>
        </div>
        <span
          className="absolute -bottom-1 left-1/2 z-[3] flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border-2 text-[12px] font-black"
          style={{ borderColor: palette.accent2, background: '#07040a', color: palette.accent, boxShadow: `0 0 12px ${palette.glow}` }}
        >
          {hidden ? '?' : palette.symbol}
        </span>
      </div>

      {vip && (
        <span
          className="mt-1.5 rounded-full border-2 px-2 py-[1px] text-[9px] font-black tracking-wider"
          style={{ borderColor: vip.border, background: vip.background, color: vip.color }}
        >
          VIP{vipLevel}
        </span>
      )}

      {statusLabel && <p className="mt-1 text-[10px] font-black tracking-[0.3em] text-destructive">{statusLabel}</p>}

      <p
        className="mt-1.5 max-w-full break-words px-2 text-center text-[22px] font-black leading-tight"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif', textShadow: `0 0 10px ${palette.glow}, 0 0 26px ${palette.glow}` }}
      >
        {name}
      </p>
      {roleLabel && <p className="mt-0.5 max-w-full truncate text-[10px] font-bold" style={{ color: palette.accent2 }}>{roleLabel}</p>}

      {/* Cinsiyet + yaş ve varsa ajans/yayıncı etiketleri tek satırda. */}
      <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
        <span
          className="flex items-center gap-1 rounded-full border px-2 py-[2px] text-[10px] font-bold"
          style={{ borderColor: palette.accent, color: palette.accent, background: 'rgba(0,0,0,0.5)' }}
        >
          {palette.symbol} {age === null || age === undefined ? genderLabel : age}
        </span>
        {tags.map((tag) => (
          <span key={tag} className="rounded-full border border-[#F5C542]/50 bg-[#F5C542]/10 px-2 py-[2px] text-[9.5px] font-black text-[#F5C542]">{tag}</span>
        ))}
      </div>

      {/* Kimlik satırı: kopyalanabilir ID, ülke ve kayıt tarihi. */}
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] font-semibold text-white/70">
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
        {country && (
          <span className="flex items-center gap-1"><span className="text-[12px]">{flag}</span>{country}</span>
        )}
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3" style={{ color: palette.accent2 }} />{joinDate}
        </span>
      </div>

      {/* Rozetler: seviye, N, hediye alış. */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
        {level > 0 && (
          <span
            className="flex items-center gap-1 rounded-full border px-2 py-[1px] text-[10px] font-black tabular-nums"
            style={{ borderColor: palette.accent2, color: palette.accent2, background: 'rgba(0,0,0,0.5)', boxShadow: `0 0 12px -4px ${palette.glow}` }}
          >
            <Star className="h-3 w-3" fill="currentColor" /> LVL {level}
          </span>
        )}
        {nLevel > 0 && (
          <span
            className="flex items-center gap-1 rounded-full border px-2 py-[1px] text-[10px] font-black tabular-nums"
            style={{ borderColor: '#cfd8dc', color: '#fff', background: '#4b664d' }}
          >
            <Shield className="h-3 w-3" fill="currentColor" /> N{nLevel}
          </span>
        )}
        {receivedLevel > 0 && (
          <span
            className="flex items-center gap-1 rounded-full border px-2 py-[1px] text-[10px] font-black tabular-nums text-white"
            style={{ borderColor: palette.accent, background: receivedColor(receivedTier) }}
          >
            <Heart className="h-3 w-3" fill="currentColor" /> {receivedLevel}
          </span>
        )}
      </div>
    </div>
  );
}