import useVipEntries from '@/components/vip/useVipEntries';
import EntranceScene from '@/components/store/EntranceScene';
export default function VipRoomEntrance({ roomId, inline = false }) {
  const { person, reduced, dismiss } = useVipEntries(roomId);
  return person ? <EntranceScene key={person.id} person={person} reduced={reduced} dismiss={dismiss} inline={inline} /> : null;
}