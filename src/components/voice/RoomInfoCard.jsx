import { useMemo } from 'react';
import { Eye, LogOut, MoreHorizontal } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { isHiddenName } from '@/lib/hiddenUser';
import useMessageProfiles from '@/hooks/useMessageProfiles';

// Bu uzunluktan sonra oda ismi soldan akmaya başlar.
const MARQUEE_AFTER = 10;

/**
 * Oda kimlik kartı (referans ölçüsü): solda oda sahibinin kare profili, ortada büyük oda ismi ve
 * altında gri kimlik numarası; sağda izleyici sayacı, "..." menüsü ve kırmızı çıkış tuşu.
 * Kart geniş ve yataydır, ekran genişliğinin ~%92'sini kaplar; hiçbir nesne sıkıştırılmaz.
 * Sahibin profiline dokununca kişinin profili, kartın diğer yerine dokununca oda paneli açılır.
 */
export default function RoomInfoCard({
  room,
  onOpen,
  onOpenOwner,
  viewerCount = 0,
  onOpenViewers,
  canMod = false,
  menuHighlighted = false,
  onOpenMenu,
  onExit,
}) {
  const ownerId = room?.owner_id;
  const ids = useMemo(() => (ownerId ? [ownerId] : []), [ownerId]);
  const profile = useMessageProfiles(ids)[ownerId] || {};

  // Gizli kullanıcının odasında takma ad kalır; kimlik numarası yazılmaz.
  const ownerHidden = isHiddenName(room?.owner_name);
  const ownerName = ownerHidden
    ? room.owner_name
    : profile.username || room?.owner_name || profile.full_name || 'Kullanıcı';
  // Kullanıcının kimlik numarası: profil kartlarındaki üye numarasının aynısıdır.
  const memberId = !ownerHidden && profile.member_id && profile.member_id !== '-' ? String(profile.member_id) : '';
  const label = room?.name || 'Oda';
  const scrolls = label.length > MARQUEE_AFTER;

  return (
    <div className="flex min-h-[88px] w-full items-center gap-2.5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] py-3 pl-3 pr-2.5 backdrop-blur-md">
      {/* Sol: oda sahibinin kare profili — dokununca oda sahibinin profili açılır. */}
      <button
        type="button"
        onClick={() => onOpenOwner?.(ownerId)}
        aria-label={`${ownerName} profilini gör`}
        className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 transition-transform active:scale-95"
      >
        {profile.avatar
          ? <Image src={profile.avatar} alt={ownerName} className="h-full w-full" fittingType="fill" draggable={false} />
          : <span className="text-base font-bold text-white/80">{ownerName.trim().charAt(0)}</span>}
      </button>

      {/* Orta: oda ismi büyük ve beyaz, altında kimlik numarası küçük ve gri. */}
      <button type="button" onClick={() => onOpen?.()} className="min-w-0 flex-1 text-left">
        {scrolls ? (
          <span className="room-name-fade block w-full overflow-hidden">
            <span
              className="room-name-marquee flex w-max whitespace-nowrap"
              style={{ animationDuration: `${Math.max(8, label.length * 0.5)}s` }}
            >
              <span className="pr-8 text-base font-bold text-white">{label}</span>
              <span className="pr-8 text-base font-bold text-white" aria-hidden="true">{label}</span>
            </span>
          </span>
        ) : (
          <span className="block w-full truncate text-base font-bold text-white">{label}</span>
        )}
        {memberId && (
          <span className="mt-1 block w-full truncate text-xs leading-tight tabular-nums text-white/60">
            ID:{memberId}
          </span>
        )}
      </button>

      {/* Sağ: izleyici sayacı, "..." menüsü ve kırmızı çıkış — referanstaki üç nesne yan yana. */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onOpenViewers?.()}
          title={`Odada ${viewerCount} kişi var`}
          aria-label={`Odada ${viewerCount} kişi var — kimler izliyor gör`}
          className="flex h-10 min-w-[2.5rem] items-center justify-center gap-1 rounded-full bg-white/10 px-2.5 text-white transition-transform active:scale-95"
        >
          <Eye className="h-4 w-4 text-white/80" />
          <span className="text-sm font-bold tabular-nums">{viewerCount}</span>
        </button>
        {/* "…" menüsü yalnızca oda sahibi ve yöneticilerde görünür; müzik çalarken altın renkte parlar. */}
        {canMod && (
          <button
            type="button"
            onClick={() => onOpenMenu?.()}
            aria-label="Oda ayarları"
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95 ${menuHighlighted ? 'bg-[#FFD700] text-black shadow-[0_0_16px_-4px_rgba(255,215,0,0.95)]' : 'bg-white/10 text-white'}`}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onExit?.()}
          aria-label="Odadan çık"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white transition-transform active:scale-95"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}