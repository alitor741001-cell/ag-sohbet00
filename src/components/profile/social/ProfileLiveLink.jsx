import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';

export default function ProfileLiveLink({ liveRoom, onJoin }) {
  if (!liveRoom) return null;
  return (
    <Link to={liveRoom.link} onClick={onJoin} aria-label="Yayında, yayına katıl" className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary active:scale-95">
      <Radio className="h-3.5 w-3.5" /> Yayında
    </Link>
  );
}