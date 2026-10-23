import useVipEntries from '@/components/vip/useVipEntries';
import EntranceBanner from '@/components/vip/EntranceBanner';
export default function VipRoomEntrance({ roomId }) {
  const { person, dismiss } = useVipEntries(roomId);
  return person ? <EntranceBanner key={person.id} person={person} onDone={dismiss} /> : null;
}