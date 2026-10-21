import CrystalSloganRow from '@/components/profile/crystal/CrystalSloganRow';
import CrystalAvatar from '@/components/profile/crystal/CrystalAvatar';
import CrystalNameBlock from '@/components/profile/crystal/CrystalNameBlock';
import CrystalStatPills from '@/components/profile/crystal/CrystalStatPills';
import CrystalInfoBars from '@/components/profile/crystal/CrystalInfoBars';
import CrystalRectButton from '@/components/profile/crystal/CrystalRectButton';
import CrystalWideButton from '@/components/profile/crystal/CrystalWideButton';

/**
 * Profil kartının gövdesi: referans görseldeki sıra birebir korunur →
 * üstte slogan + el yazısı imza, kanatlı fotoğraf + taçlar + VIP, büyük rol başlığı,
 * üç kapsül, kayıt tarihi barı, üç işlem kutusu, üç geniş bar ve dört yuvarlak düğme.
 */
export default function CrystalProfileCard({
  name, avatar, tone = 'blue', vipLevel = 0, genderSymbol = '♂', statusLabel = '', roleLabel = '',
  likes = 0, nLevel = 0, joinDate = '', memberId = '', copied = false, onCopyId,
  country = '', flag = '', rectItems = [], wideItems = [], circleNodes = [], extraNodes = [],
  infoRows = [], hidden = false, slogan = 'HER ZAMAN DAHA GÜÇLÜ', signature = 'Sen Özelsin',
}) {
  return (
    <div className="flex flex-col">
      <div className="pt-[22px]">
        <CrystalAvatar
          avatar={avatar}
          name={name}
          vipLevel={hidden ? 0 : vipLevel}
          genderSymbol={genderSymbol}
          tone={tone}
        />
      </div>

      <CrystalSloganRow tone={tone} slogan={slogan} signature={signature} />

      {statusLabel && <p className="mt-1 text-center text-[9px] font-black tracking-[0.28em] text-destructive">{statusLabel}</p>}

      <CrystalNameBlock name={name} roleLabel={roleLabel} tone={tone} />

      <CrystalStatPills likes={hidden ? 0 : likes} nLevel={nLevel} vipLevel={hidden ? 0 : vipLevel} />

      {hidden ? (
        <p className="mt-2 rounded-full border px-3 py-1.5 text-center text-[9px] leading-snug text-white/65" style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(2,6,15,0.7)' }}>
          Gizli Kullanıcı modu etkin: kimlik bilgileri gizli kalır.
        </p>
      ) : (
        <CrystalInfoBars
          joinDate={joinDate}
          memberId={memberId}
          copied={copied}
          onCopyId={onCopyId}
          country={country}
          flag={flag}
          tone={tone}
        />
      )}

      {!hidden && infoRows.length > 0 && (
        <div className="mt-1.5 space-y-0.5 rounded-xl border px-2.5 py-1.5 text-[9px]" style={{ borderColor: 'rgba(212,175,55,0.35)', background: 'rgba(2,6,15,0.7)' }}>
          {infoRows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-2">
              <span className="shrink-0 text-white/50">{row.label}</span>
              <span className="min-w-0 break-words text-right font-semibold text-white">{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {rectItems.length > 0 && (
        <div
          className="mt-2 grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, rectItems.length))}, minmax(0, 1fr))` }}
        >
          {rectItems.map(({ key, ...item }) => (
            <CrystalRectButton key={key} {...item} tone={tone} />
          ))}
        </div>
      )}

      {wideItems.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {wideItems.map(({ key, ...item }) => (
            <CrystalWideButton key={key} {...item} tone={tone} />
          ))}
        </div>
      )}

      {circleNodes.length > 0 && (
        <div className="mt-2.5 flex items-start justify-between gap-1">
          {circleNodes}
        </div>
      )}

      {extraNodes.length > 0 && (
        <div className="mt-2 flex flex-wrap items-start justify-center gap-1 border-t pt-2" style={{ borderColor: 'rgba(212,175,55,0.3)' }}>
          {extraNodes}
        </div>
      )}
    </div>
  );
}