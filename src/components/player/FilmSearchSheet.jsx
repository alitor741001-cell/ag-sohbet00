import { useEffect, useState } from 'react';
import { Link2, Loader2, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import FilmSearchResultRow from '@/components/player/FilmSearchResultRow';

/** Film adıyla arama paneli: uygulamanın içinde arar, seçilen film odanın ekranında açılır. */
export default function FilmSearchSheet({ open, onClose, canMod, onPlay, onPasteLink, initialQuery = '', initialResults = [], onResults }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(initialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(initialResults.length > 0);

  // Panel her açılışta son aramayı ve sonuçları korur: geri dönüp yeniden film seçilebilir.
  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
    setResults(initialResults);
    setError('');
    setSearched(initialResults.length > 0);
  }, [open, initialQuery, initialResults]);

  const search = async (event) => {
    event.preventDefault();
    const text = query.trim();
    if (text.length < 2 || loading) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const response = await base44.functions.invoke('search-films', { query: text });
      const list = response.data?.results || [];
      setResults(list);
      onResults?.(text, list);
    } catch (e) {
      setResults([]);
      setError(e.response?.data?.error || 'Film aranamadı, tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[85] rounded-t-2xl border-t border-border bg-card/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/40" />
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Search className="h-4 w-4 text-red-500" /> Film ara
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {canMod
            ? 'Film adını yaz: film bu ekranda bulunur ve odada tam ekran açılır.'
            : 'Oda sahibi film adı yazıp açtığında film odada herkes için oynar.'}
        </p>

        <form onSubmit={search} className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Film adı yaz (ör. Cehennem Melekleri 2)"
              autoComplete="off"
              className="w-full rounded-xl border border-white/10 bg-[hsl(var(--secondary))] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-red-500/40"
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

        {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}

        {results.length > 0 && (
          <div className="mt-3 max-h-[44vh] space-y-2 overflow-y-auto pr-1">
            {results.map((item) => (
              <FilmSearchResultRow
                key={item.video_id}
                item={item}
                canMod={canMod}
                onPick={(videoId) => { onPlay?.(videoId); onClose?.(); }}
              />
            ))}
          </div>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Film bulunamadı. Adını tam yazıp tekrar dene (ör. “Cehennem Melekleri 2 Türkçe dublaj”).
          </p>
        )}

        {!canMod && results.length > 0 && (
          <p className="mt-2 text-[11px] text-amber-300/80">Filmi oda sahibi seçip ekranı açabilir.</p>
        )}

        <div className="mt-3 flex items-center gap-2">
          {onPasteLink && (
            <button
              type="button"
              onClick={() => { onClose?.(); onPasteLink(); }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white transition active:scale-95"
            >
              <Link2 className="h-4 w-4" /> Bağlantı yapıştır
            </button>
          )}
          <button type="button" onClick={onClose} className="flex-1 py-3 text-xs text-muted-foreground">Kapat</button>
        </div>
      </div>
    </>
  );
}