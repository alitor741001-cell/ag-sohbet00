import { useState } from 'react';
import { ExternalLink, Globe, Link2, Play, TriangleAlert, Youtube } from 'lucide-react';
import { openInBrowser, resolveFilmMedia } from '@/lib/filmSearch';

/**
 * Uygulama içi oynatıcı: yalnızca teknik olarak izin verilen ve doğrudan
 * oynatılabilen bağlantılar oynatılır (YouTube gömme, doğrudan video dosyası).
 * Site gömülmeyi engelliyorsa boş ekran yerine "Tarayıcıda Aç" sunulur.
 */
export default function FilmPlayerPanel() {
  const [input, setInput] = useState('');
  const [media, setMedia] = useState(null);
  const [error, setError] = useState('');

  const play = (event) => {
    event.preventDefault();
    const resolved = resolveFilmMedia(input);
    if (!resolved) {
      setError('Oynatılabilir bir video ya da sayfa bağlantısı yapıştırın.');
      setMedia(null);
      return;
    }
    setError('');
    setMedia(resolved);
  };

  return (
    <section className="mx-auto w-full max-w-2xl px-4">
      <div className="rounded-3xl border border-white/10 bg-[#0b0d16]/90 p-4">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-white">
          <Play className="h-4 w-4 text-[#ef4343]" /> Uygulama içinde oynat
        </h2>
        <p className="mt-1 text-[11px] leading-snug text-white/45">
          Bir YouTube videosu, film fragmanı veya doğrudan video (.mp4 / .webm) bağlantısı yapıştırın.
        </p>

        <form onSubmit={play} className="mt-3 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/12 bg-black/50 px-3">
            <Link2 className="h-4 w-4 shrink-0 text-white/40" />
            <input
              value={input}
              onChange={(event) => { setInput(event.target.value); setError(''); }}
              inputMode="url"
              autoComplete="off"
              placeholder="https://www.youtube.com/watch?v=..."
              className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>
          <button
            type="submit"
            className="flex h-12 shrink-0 items-center gap-1.5 rounded-2xl bg-[#ef4343] px-4 text-sm font-black text-black active:scale-95"
          >
            Oynat
          </button>
        </form>

        {error && <p className="mt-2 text-[11px] font-semibold text-[#ff9a9a]">{error}</p>}

        {media && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
            {media.kind === 'youtube' && (
              <iframe
                key={media.embedUrl}
                src={media.embedUrl}
                title="Film videosu"
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            )}
            {media.kind === 'video' && (
              <video key={media.url} src={media.url} controls playsInline className="aspect-video w-full bg-black" />
            )}
            {media.kind === 'page' && (
              <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                <TriangleAlert className="h-7 w-7 text-[#ffb02e]" />
                <div>
                  <p className="text-sm font-extrabold text-white">Bu site uygulama içinde açılmıyor</p>
                  <p className="mt-1 text-[11px] leading-snug text-white/55">
                    Film siteleri güvenliği için kendi sayfalarının uygulama içinde gösterilmesine izin vermiyor.
                    Sayfayı kendi tarayıcınızda açabilirsiniz.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-3 py-2.5">
              <button
                type="button"
                onClick={() => openInBrowser(media.url)}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] font-extrabold text-white active:scale-95"
              >
                <Globe className="h-3.5 w-3.5" /> Tarayıcıda Aç
              </button>
              {media.kind === 'youtube' && (
                <button
                  type="button"
                  onClick={() => openInBrowser(media.url)}
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] font-extrabold text-white active:scale-95"
                >
                  <Youtube className="h-3.5 w-3.5" /> YouTube'da Aç
                </button>
              )}
              <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-white/35">
                <ExternalLink className="h-3 w-3" /> Bağlantı yeni sekmede açılır
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}