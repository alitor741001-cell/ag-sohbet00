import { useEffect, useState } from 'react';
import { Link2, Loader2, Search, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import FilmSearchResultRow from '@/components/player/FilmSearchResultRow';

/** Hazır kategoriler: film adı bilinmese de tüm filmler gezilebilir. */
const CATEGORIES = [
  { label: 'Aksiyon', query: 'Aksiyon filmi Türkçe dublaj tek parça full' },
  { label: 'Komedi', query: 'Komedi filmi Türkçe dublaj tek parça full' },
  { label: 'Korku', query: 'Korku filmi Türkçe dublaj tek parça full' },
  { label: 'Dram', query: 'Dram filmi Türkçe dublaj tek parça full' },
  { label: 'Bilim Kurgu', query: 'Bilim kurgu filmi Türkçe dublaj tek parça' },
  { label: 'Animasyon', query: 'Animasyon filmi Türkçe dublaj tek parça' },
  { label: 'Yerli Film', query: 'Yerli film tek parça full izle' },
  { label: 'Dizi', query: 'Yerli dizi full bölüm izle' },
];

/** Film paneli: uygulamanın içinde arar, seçilen film odanın ekranında tam ekran açılır. */
export default function FilmSearchSheet({ open, onClose, canMod, onPlay, onPasteLink, initialQuery = '', initialResults = [], onResults }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(initialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(initialResults.length > 0);
  const [category, setCategory] = useState('');

  // Panel her açılışta son aramayı ve sonuçları korur: geri dönüp yeniden film seçilebilir.
  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
    setResults(initialResults);
    setError('');
    setSearched(initialResults.length > 0);
  }, [open, initialQuery, initialResults]);

  const runSearch = async (display, backendQuery) => {
    if (loading) return;
    setQuery(display);
    setCategory(CATEGORIES.some((entry) => entry.label === display) ? display : '');
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const response = await base44.functions.invoke('search-films', { query: backendQuery });
      const list = response.data?.results || [];
      setResults(list);
      onResults?.(display, list);
    } catch (e) {
      setResults([]);
      setError(e.response?.data?.error || 'Film aranamadı, tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  const search = (event) => {
    event.preventDefault();
    const text = query.trim();
    if (text.length < 2) return;
    runSearch(text, text);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex flex-col bg-black pl-[max(env(safe-area-inset-left),0px)] pr-[max(env(safe-area-inset-right),0px)] pt-[max(env(safe-area-inset-top),0.75rem)] pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <div className="flex items-center justify-between px-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <Search className="h-4 w-4 text-red-500" /> Filmler
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="rounded-full border border-white/15 bg-white/5 p-2 text-white transition active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-1 px-4 text-[11px] text-white/60">
        {canMod
          ? 'Film adını yaz ya da kategori seç: seçtiğin film odada tam ekran açılır.'
          : 'Oda sahibi film seçip açtığında film odada herkes için oynar.'}
      </p>

      <form onSubmit={search} className="mt-3 flex items-center gap-2 px-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Film adı yaz (ör. Cehennem Melekleri 2)"
            autoComplete="off"
            className="w-full rounded-xl border border-white/10 bg-white/10 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-red-500/40"
          />
        </div>
        <button
          type="submit"
          disabled={query.trim().length < 2 || loading}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Ara
        </button>
      </form>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATEGORIES.map((entry) => (
          <button
            key={entry.label}
            type="button"
            onClick={() => runSearch(entry.label, entry.query)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition active:scale-95 ${
              category === entry.label ? 'border-red-500/70 bg-red-600/80 text-white' : 'border-white/25 bg-white/10 text-white'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-2 px-4 text-[11px] text-red-400">{error}</p>}

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto px-4">
        {loading && <p className="text-[11px] text-white/60">Filmler getiriliyor…</p>}

        {results.map((item) => (
          <FilmSearchResultRow
            key={item.video_id}
            item={item}
            canMod={canMod}
            onPick={(videoId) => { onPlay?.(videoId); onClose?.(); }}
          />
        ))}

        {!loading && searched && results.length === 0 && !error && (
          <p className="text-[11px] text-white/60">
            Film bulunamadı. Adını tam yazıp tekrar dene (ör. “Cehennem Melekleri 2 Türkçe dublaj”).
          </p>
        )}

        {!loading && !searched && (
          <p className="text-[11px] text-white/60">Film adını yaz ya da yukarıdan bir kategori seç: tüm filmler burada listelenir.</p>
        )}

        {!canMod && results.length > 0 && (
          <p className="text-[11px] text-amber-300/80">Filmi oda sahibi seçip ekranı açabilir.</p>
        )}
      </div>

      {onPasteLink && (
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => { onClose?.(); onPasteLink(); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white transition active:scale-95"
          >
            <Link2 className="h-4 w-4" /> Bağlantı yapıştır
          </button>
        </div>
      )}
    </div>
  );
}