import { useMemo } from 'react';
import { Image } from '@/components/ui/image';
import { isHiddenName } from '@/lib/hiddenUser';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import RoomHeaderControls from '@/components/voice/RoomHeaderControls';

export default function RoomInfoCard({ room, onOpen, viewerCount = 0, onOpenViewers, canMod = false, menuHighlighted = false, onOpenMenu, onExit }) {
  const ownerId = room?.owner_id;
  const ids = useMemo(() => ownerId ? [ownerId] : [], [ownerId]);
  const profile = useMessageProfiles(ids)[ownerId] || {};
  const ownerHidden = isHiddenName(room?.owner_name);
  const ownerName = ownerHidden ? room.owner_name : profile.username || room?.owner_name || profile.full_name || 'Kullanıcı';
  const memberId = !ownerHidden && profile.member_id && profile.member_id !== '-' ? String(profile.member_id) : '';
  const roomName = room?.name || 'Oda';

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex h-[clamp(48px,11vw,58px)] w-[calc(100%-140px)] min-w-0 shrink-0 min-[375px]:w-[54%] items-center gap-1.5 rounded-xl border border-slot-text/10 bg-slot-text/20 p-1.5 backdrop-blur-md">
        <button type="button" onClick={onOpen} aria-label="Oda profilini aç" className="flex h-11 w-9 shrink-0 items-center justify-center min-[390px]:w-10">
          <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-slot-text/10">
            {profile.avatar
              ? <Image src={profile.avatar} alt={ownerName} className="aspect-square w-full" fittingType="fill" draggable={false} />
              : <span className="text-base font-bold text-slot-text">{ownerName.trim().charAt(0)}</span>}
          </span>
        </button>
        <div className="min-w-0 flex-1 overflow-hidden text-left">
          {/* Oda ismi sürekli sola kayar: iki kopya arasında kesintisiz döngü kurulur. */}
          <span className="room-name-fade block overflow-hidden" title={roomName}>
            <span className="room-name-marquee flex w-max">
              <span className="pr-8 text-sm font-bold leading-tight text-slot-text min-[390px]:text-base">{roomName}</span>
              <span aria-hidden="true" className="pr-8 text-sm font-bold leading-tight text-slot-text min-[390px]:text-base">{roomName}</span>
            </span>
          </span>
          {memberId && <span className="mt-1 block truncate text-xs leading-tight tabular-nums text-slot-text/60">ID:{memberId}</span>}
        </div>
      </div>
      <RoomHeaderControls {...{ viewerCount, onOpenViewers, canMod, menuHighlighted, onOpenMenu, onExit }} />
    </div>
  );
}