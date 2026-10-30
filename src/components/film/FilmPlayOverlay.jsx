import { X } from 'lucide-react';

/** Seçilen film uygulamanın üstünde oynar: sayfa değişmez, tarayıcıya çıkılmaz. */
export default function FilmPlayOverlay({ film, onClose }) {
  if (!film) return null;
  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-black" role="dialog" aria-modal="true">
      <div
        className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 0.625rem)' }}
      >
        <p className="min-w-0 flex-1 truncate text-sm font-extrabold text-white">{film.title || 'Film'}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Filmi kapat"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden bg-black">
        <iframe
          key={film.videoId}
          src={`https://www.youtube-nocookie.com/embed/${film.videoId}?rel=0&playsinline=1&autoplay=1`}
          title={film.title || 'Film'}
          className="aspect-video w-full max-w-5xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}