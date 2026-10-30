import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clapperboard } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import FilmSearchBar from '@/components/film/FilmSearchBar';
import FilmSearchResults from '@/components/film/FilmSearchResults';
import FilmPlayOverlay from '@/components/film/FilmPlayOverlay';
import LegalPlatformGrid from '@/components/film/LegalPlatformGrid';

/** Arama türüne göre sorgu sonu: oyuncu ve tür aramaları da film sonucu getirir. */
const MODE_SUFFIX = { title: '', actor: ' oyuncusu filmleri', genre: ' filmi' };
/** YouTube kutusu: uygulama içinde oynayan filmleri listeler. */
const YOUTUBE_QUERY = 'türkçe dublaj tek parça full film';

/** Film İzle: arama ve oynatma uygulamanın içinde; sayfadan çıkılmaz. */
export default function FilmWatch() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  // Seçilen film uygulamanın üstünde oynar; sayfa yapısı aynı kalır.
  const [film, setFilm] = useState(null);

  const runSearch = async (text, mode = 'title') => {
    if (loading) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const response = await base44.functions.invoke('search-films', {
        query: `${text}${MODE_SUFFIX[mode] || ''}`.trim(),
      });
      setResults(response.data?.results || []);
    } catch (e) {
      setResults([]);
      setError(e.response?.data?.error || 'Film aranamadı, tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

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
        <FilmSearchBar onSearch={({ text, mode }) => runSearch(text, mode)} loading={loading} />
        <FilmSearchResults
          results={results}
          loading={loading}
          error={error}
          searched={searched}
          onPick={setFilm}
        />
        <LegalPlatformGrid onYouTube={() => runSearch(YOUTUBE_QUERY)} />
      </div>

      <FilmPlayOverlay film={film} onClose={() => setFilm(null)} />
    </div>
  );
}