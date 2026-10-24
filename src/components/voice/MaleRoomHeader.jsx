import MaleRoomSprite from '@/components/voice/MaleRoomSprite';
import { Image } from '@/components/ui/image';
export default function MaleRoomHeader({ room, profile, viewerCount, onOpen, onOpenViewers, onOpenMenu, onExit }) {
  return (
    <MaleRoomSprite x={0} y={51} w={497} h={124} className="w-full">
      <button className="male-room-profile" type="button" onClick={onOpen} aria-label="Oda profilini aç">
        {profile.avatar && <Image src={profile.avatar} alt="" fittingType="fill" className="h-full w-full rounded-full" />}
      </button>
      <button type="button" onClick={onOpen} className="male-room-identity">
        <strong>{room?.name || 'Oda'}</strong>
        <span>ID:{room?.room_number || room?.personal_room_code || profile.member_id || '—'} <i /></span>
      </button>
      <button type="button" className="male-room-header-hit" style={{ left: '63%', width: '12%' }} onClick={onOpenViewers} aria-label="Odadakiler"><span className="male-room-viewers">{viewerCount}</span></button>
      <button type="button" className="male-room-header-hit" style={{ left: '75%', width: '12%' }} onClick={onOpenMenu} aria-label="Oda menüsü" />
      <button type="button" className="male-room-header-hit" style={{ left: '87%', width: '13%' }} onClick={onExit} aria-label="Odadan çık" />
    </MaleRoomSprite>
  );
}