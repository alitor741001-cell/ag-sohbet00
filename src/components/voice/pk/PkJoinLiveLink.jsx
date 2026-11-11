import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';

/** Rakibin profil kartında sağ üstte durur: rakibin odasına (yayınına) geçirir. */
export default function PkJoinLiveLink({ roomId }) {
  if (!roomId) return null;
  return (
    <Link
      to={`/sesli-oda/${roomId}`}
      aria-label="Yayına katıl"
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1.5 text-xs font-bold text-primary active:scale-95"
    >
      <Radio className="h-3.5 w-3.5" /> Yayına katıl
    </Link>
  );
}