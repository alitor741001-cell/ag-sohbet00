import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clapperboard } from 'lucide-react';
import FilmAppSearch from '@/components/film/FilmAppSearch';
import FilmInlinePlayer from '@/components/film/FilmInlinePlayer';
import FilmPlayerPanel from '@/components/film/FilmPlayerPanel';
import LegalPlatformGrid from '@/components/film/LegalPlatformGrid';

/** Film İzle: uygulama içi arama, uygulama içinde oynatma ve yasal platformlar. */
export default function FilmWatch() {
  const navigate = useNavigate();
  const [film, setFilm] = useState(null);
  const playerRef = useRef(null);

  // Film seçilince oynatıcı ekranın üstüne kaydırılır: film hemen görünür.
  useEffect(() => {
    if (film) playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [film]);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div className="dark min-h-screen bg-[#05060c] pb-[calc(2rem+env(safe-area-inset-bottom))] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 15% 0%, rgba(239,67,67,0.22), transparent 55%), radial-gradient(circle at 85% 8%, rgba(56,189,248,0.13), transparent 52%)',
        }}
      />

      <header
        className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/10 bg-[#05060c]/90 px-3 py-3 backdrop-blur lg:top-16"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}
      >
        <button
          type="button"
          onClick={goBack}
          aria-label="Geri"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="flex items-center gap-2 text-base font-extrabold">
          <Clapperboard className="h-4 w-4 text-[#ef4343]" /> Film İzle
        </h1>
      </header>

      <div className="flex flex-col gap-5 pt-4">
        <div ref={playerRef}>
          <FilmInlinePlayer film={film} onClose={() => setFilm(null)} />
        </div>
        <FilmAppSearch onPick={setFilm} />
        <FilmPlayerPanel />
        <LegalPlatformGrid />
      </div>
    </div>
  );
}