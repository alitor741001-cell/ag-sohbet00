import { useMemo } from 'react';
import { Image } from '@/components/ui/image';
import { isHiddenName } from '@/lib/hiddenUser';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import useRoomBarArt from '@/components/voice/useRoomBarArt';

const spot = (left, top, width, height) => ({ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` });

/** Sesli oda üst şeridi: gönderilen tasarım görseli birebir, üstünde canlı oda bilgisi ve dokunma alanları. */
export default function RoomInfoCard({ room, onOpen, viewerCount = 0, onOpenViewers, canMod = false, onOpenMenu, onExit }) {
  const art = useRoomBarArt('top');
  const ownerId = room?.owner_id;
  const ids = useMemo(() => ownerId ? [ownerId] : [], [ownerId]);
  const profile = useMessageProfiles(ids)[ownerId] || {};
  const ownerHidden = isHiddenName(room?.owner_name);
  const ownerName = ownerHidden ? room.owner_name : profile.username || room?.owner_name || profile.full_name || 'Kullanıcı';
  const memberId = !ownerHidden && profile.member_id && profile.member_id !== '-' ? String(profile.member_id) : '';
  const roomName = room?.name || 'Oda';

  return (
    <div className="relative w-full" style={{ aspectRatio: art?.ratio || '851 / 186' }}>
      {art && <img src={art.src} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />}
      <button type="button" onClick={onOpen} aria-label="Oda profilini aç" className="absolute overflow-hidden rounded-full bg-[#0a0f2a]" style={spot(5.6, 13, 12.6, 62)}>
        {profile.avatar
          ? <Image src={profile.avatar} alt={ownerName} className="h-full w-full" fittingType="fill" draggable={false} />
          : <span className="flex h-full w-full items-center justify-center text-lg font-bold text-white">{ownerName.trim().charAt(0)}</span>}
      </button>
      <span className="pointer-events-none absolute rounded-md bg-[#0f1a4a] px-1 text-[9px] font-black italic leading-tight text-white ring-1 ring-[#5b8cff]" style={{ left: '8.3%', top: '72%' }}>AG</span>
      <div className="pointer-events-none absolute flex flex-col justify-center overflow-hidden bg-[#060a1f] text-left" style={spot(22.5, 20, 28, 58)}>
        <span className="room-name-fade block overflow-hidden" title={roomName}>
          <span className="room-name-marquee flex w-max">
            <span className="pr-8 text-[clamp(13px,4vw,18px)] font-bold leading-tight text-white">{roomName}</span>
            <span aria-hidden="true" className="pr-8 text-[clamp(13px,4vw,18px)] font-bold leading-tight text-white">{roomName}</span>
          </span>
        </span>
        {memberId && <span className="mt-0.5 flex items-center gap-1 truncate text-[clamp(10px,2.8vw,13px)] tabular-nums text-white/85">ID:{memberId}<span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" /></span>}
      </div>
      <button type="button" onClick={onOpenViewers} aria-label={`Odada ${viewerCount} kişi var`} className="absolute rounded-lg active:bg-white/10" style={spot(63.5, 16, 10.5, 62)}>
        <span className="absolute bottom-[30%] right-[4%] bg-[#0b1233] px-0.5 text-[clamp(10px,3vw,14px)] font-bold tabular-nums text-white">{viewerCount}</span>
      </button>
      <button type="button" onClick={canMod ? onOpenMenu : undefined} aria-label="Oda ayarları" className="absolute rounded-lg active:bg-white/10" style={spot(75.8, 16, 10.5, 62)} />
      <button type="button" onClick={onExit} aria-label="Odadan çık" className="absolute rounded-lg active:bg-white/10" style={spot(87.8, 16, 11, 62)} />
    </div>
  );
}