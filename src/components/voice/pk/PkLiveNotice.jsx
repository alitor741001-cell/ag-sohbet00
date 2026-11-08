import { ChevronRight, Ticket, Users, Video } from 'lucide-react';

/** Alt panelin üstündeki hediye şeridi, katılım bilgisi ve canlı yayın notu. */
export default function PkLiveNotice({ onOpenGifts, peopleCount = 0 }) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onOpenGifts}
        className="flex w-full items-center gap-1.5 rounded-lg bg-amber-400/15 px-2 py-1 text-left active:scale-[0.99]"
      >
        <Ticket className="h-3.5 w-3.5 shrink-0 text-amber-300" />
        <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-amber-200">
          Hediye gönder, PK puanını yükselt
        </span>
        <ChevronRight className="h-3 w-3 shrink-0 text-amber-200" />
      </button>

      <span className="flex w-fit items-center gap-1 rounded-full bg-[#25f4ee]/15 px-2 py-0.5 text-[9.5px] font-black text-[#8ffaf6]">
        <Users className="h-2.5 w-2.5" /> {peopleCount} kişi yayında
      </span>

      <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2 py-1">
        <Video className="h-3 w-3 shrink-0 text-white/70" />
        <p className="text-[9.5px] font-semibold leading-snug text-white/70">
          CANLI Yayın maçı başladı! Yayıncına destek ol, hediye gönder.
        </p>
      </div>
    </div>
  );
}