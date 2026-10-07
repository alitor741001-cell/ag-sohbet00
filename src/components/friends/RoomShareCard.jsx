import { useNavigate } from 'react-router-dom';
import { Radio } from 'lucide-react';
import { roomShareLink } from '@/lib/roomShare';

/** Özel sohbette paylaşılan yayın kartı: kimin paylaştığı ve kırmızı "Katıl" düğmesi. */
export default function RoomShareCard({ roomId, voice = true, senderName }) {
  const navigate = useNavigate();

  return (
    <div className="min-w-[180px] space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-bold">
        <Radio className="h-3.5 w-3.5 text-primary" /> {senderName || 'Kullanıcı'} yayınını paylaştı
      </p>
      <button
        type="button"
        onClick={() => navigate(roomShareLink(roomId, voice))}
        className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground transition-transform active:scale-[0.98]"
      >
        Katıl
      </button>
    </div>
  );
}