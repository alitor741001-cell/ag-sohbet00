import { Clapperboard } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Kaynak yokken ekranda çıkan tek seçim: Film İzle bölümü. */
export default function RoomScreenLauncher() {
  return (
    // z-[60]: ekranın üstündeki görünmez kaydırma katmanı (z-54) dokunmayı yutmasın.
    <div className="relative z-[60] flex h-full w-full flex-col items-center justify-center gap-4 bg-black px-6 text-center">
      <Link
        to="/film-izle"
        className="flex items-center gap-1.5 rounded-full border border-[#ef4343]/60 bg-black/80 px-4 py-2.5 text-[13px] font-extrabold text-white shadow-[0_0_18px_rgba(239,67,67,0.45)] backdrop-blur active:scale-95"
      >
        <Clapperboard className="h-4 w-4 text-[#ef4343]" />
        Film İzle
      </Link>
      <p className="max-w-xs text-[10px] leading-relaxed text-white/40">
        Film adını yaz, yasal platformlarda izle.
      </p>
    </div>
  );
}

/** Arama sonucu varsa ekranın üstünde duran geri dönüş düğmesi. */
export function RoomScreenSwitch({ onFilms, hasResults }) {
  if (!hasResults) return null;
  return (
    <button
      type="button"
      onClick={onFilms}
      className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-[11px] font-bold text-white/80 backdrop-blur-md transition active:scale-95"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Geri
    </button>
  );
}