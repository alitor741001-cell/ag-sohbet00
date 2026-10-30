import { X } from 'lucide-react';

/** Seçilen film uygulamanın içinde oynar: YouTube gömme, sayfadan ayrılmadan. */
export default function FilmInlinePlayer({ film, onClose }) {
  if (!film) return null;
  return (
    <section className="mx-auto w-full max-w-2xl px-4">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
        <div className="relative">
          <iframe
            key={film.videoId}
            src={`https://www.youtube-nocookie.com/embed/${film.videoId}?rel=0&playsinline=1&autoplay=1`}
            title={film.title || 'Film'}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Filmi kapat"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {film.title && (
          <p className="truncate px-3 py-2 text-[11px] font-semibold text-white/70">{film.title}</p>
        )}
      </div>
    </section>
  );
}