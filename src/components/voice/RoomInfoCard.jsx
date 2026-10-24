import { useMemo } from 'react';
import { Image } from '@/components/ui/image';
import { isHiddenName } from '@/lib/hiddenUser';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import RoomHeaderControls from '@/components/voice/RoomHeaderControls';
import '@/components/voice/voiceNeonBars.css';

export default function RoomInfoCard({ room, onOpen, viewerCount = 0, onOpenViewers, canMod = false, menuHighlighted = false, onOpenMenu, onExit, giftChip }) {
  const ownerId = room?.owner_id;
  const ids = useMemo(() => ownerId ? [ownerId] : [], [ownerId]);
  const profile = useMessageProfiles(ids)[ownerId] || {};
  const ownerHidden = isHiddenName(room?.owner_name);
  const ownerName = ownerHidden ? room.owner_name : profile.username || room?.owner_name || profile.full_name || 'Kullanıcı';
  const ownerMemberId = !ownerHidden && profile.member_id && profile.member_id !== '-' ? String(profile.member_id) : '';
  const memberId = room?.room_number ? String(room.room_number) : ownerMemberId;
  const roomName = room?.name || 'Oda';

  return (
    <div className="flex w-full items-start justify-between gap-2">
      <div className="flex min-w-0 flex-1 flex-col items-start">
      <div className="neon-panel dragon-panel neon-glow flex w-full h-[clamp(52px,12vw,60px)] min-w-0 flex-1 items-center gap-2 p-1.5">
        <button type="button" onClick={onOpen} aria-label="Oda profilini aç" className="flex h-11 w-11 shrink-0 items-center justify-center">
          {/* Kare kutu: kare oranı desteklemeyen eski sürümlerde media-box-square yüksekliği verir. */}
          <span className="neon-avatar media-box-square relative flex aspect-square w-full items-center justify-center overflow-hidden bg-slot-text/10">
            {profile.avatar
              ? <Image src={profile.avatar} alt={ownerName} className="absolute inset-0 h-full w-full" fittingType="fill" draggable={false} />
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
          {memberId && <span className="mt-1 flex items-center gap-1 truncate text-xs leading-tight tabular-nums text-slot-text/75">ID:{memberId}<span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" /></span>}
        </div>
      </div>
      {giftChip}
      </div>
      <RoomHeaderControls {...{ viewerCount, onOpenViewers, canMod, menuHighlighted, onOpenMenu, onExit }} />
    </div>
  );
}