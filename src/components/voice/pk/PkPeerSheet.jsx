import { ChevronRight, Gem, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import formatCoinAmount from '@/components/voice/formatCoinAmount';

/**
 * Kamera karesine dokununca açılan rakip kartı: profil fotoğrafı, adı, turdaki puanı
 * ve kişinin profiline götüren "Ona Git" düğmesi.
 */
export default function PkPeerSheet({ person, onClose }) {
  const navigate = useNavigate();
  if (!person?.id) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/60" onClick={onClose}>
      <div
        className="w-full rounded-t-2xl bg-[#17121e] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ring-1 ring-white/12"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {person.avatar
            ? <img src={person.avatar} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-[#fe2c55]" />
            : <span className="h-12 w-12 rounded-full bg-white/15" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-black text-white">{person.name || 'Kullanıcı'}</p>
            <p className="flex items-center gap-1 text-[11px] font-bold tabular-nums text-cyan-300">
              <Gem className="h-3 w-3" /> {formatCoinAmount(person.score || 0)} puan
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/75 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2.5 flex gap-1.5">
          <button
            type="button"
            onClick={() => { onClose?.(); navigate(`/kullanici/${person.id}`); }}
            className="flex h-10 flex-1 items-center justify-center gap-1 rounded-xl bg-[#fe2c55] text-[12px] font-black text-white active:scale-95"
          >
            Ona Git <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 items-center justify-center rounded-xl bg-white/10 px-3 text-[12px] font-bold text-white/80 active:scale-95"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}