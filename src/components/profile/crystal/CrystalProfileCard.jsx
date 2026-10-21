import CrystalAvatar from '@/components/profile/crystal/CrystalAvatar';
import CrystalNameBlock from '@/components/profile/crystal/CrystalNameBlock';
import CrystalStatPills from '@/components/profile/crystal/CrystalStatPills';
import CrystalInfoBars from '@/components/profile/crystal/CrystalInfoBars';
import CrystalRectButton from '@/components/profile/crystal/CrystalRectButton';

/**
 * Sesli odadaki profil kartının gövdesi: referans görseldeki sıra birebir korunur →
 * fotoğraf + taç + VIP, isim bandı, üç kapsül, bilgi barları, dikdörtgen işlemler, yuvarlak işlemler.
 */
export default function CrystalProfileCard({
  name, avatar, tone = 'blue', vipLevel = 0, genderSymbol = '♂', statusLabel = '', roleLabel = '',
  receivedLevel = 0, nLevel = 0, joinDate = '', memberId = '', copied = false, onCopyId,
  country = '', flag = '', rectItems = [], circleNodes = [], hidden = false,
}) {
  return (
    <div className="flex flex-col">
      <CrystalAvatar avatar={avatar} name={name} vipLevel={hidden ? 0 : vipLevel} genderSymbol={genderSymbol} tone={tone} />

      {statusLabel && <p className="mt-1 text-center text-[9px] font-black tracking-[0.28em] text-destructive">{statusLabel}</p>}

      <CrystalNameBlock name={name} roleLabel={roleLabel} tone={tone} />

      <CrystalStatPills receivedLevel={receivedLevel} nLevel={nLevel} vipLevel={hidden ? 0 : vipLevel} tone={tone} />

      {hidden ? (
        <p className="mt-1.5 rounded-full border px-3 py-1.5 text-center text-[9px] leading-snug text-white/65" style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(2,6,15,0.7)' }}>
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

      {circleNodes.length > 0 && (
        <div className="mt-2 flex flex-wrap items-start justify-center gap-1.5">
          {circleNodes}
        </div>
      )}
    </div>
  );
}