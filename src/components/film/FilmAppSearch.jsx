import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import FilmSearchResultRow from '@/components/player/FilmSearchResultRow';

/** Hazır kategoriler: film adı bilinmese de filmler gezilebilir. */
const CATEGORIES = [
  { label: 'Aksiyon', query: 'aksiyon filmi Türkçe dublaj tek parça full izle' },
  { label: 'Komedi', query: 'komedi filmi Türkçe dublaj tek parça full izle' },
  { label: 'Korku', query: 'korku filmi Türkçe dublaj tek parça full izle' },
  { label: 'Dram', query: 'dram filmi Türkçe dublaj tek parça full izle' },
  { label: 'Bilim Kurgu', query: 'bilim kurgu filmi Türkçe dublaj tek parça' },
  { label: 'Animasyon', query: 'animasyon filmi Türkçe dublaj tek parça' },
  { label: 'Yerli Film', query: 'yerli film tek parça full izle' },
  { label: 'Dizi', query: 'yerli dizi full bölüm izle' },
];

/** Uygulama içi film araması: seçilen film uygulamanın üstünde oynar, sayfa değişmez. */
export default function FilmAppSearch({ onPick }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const runSearch = async (label, backendQuery) => {
    if (loading) return;
    setQuery(label);
    setCategory(CATEGORIES.some((entry) => entry.label === label) ? label : '');
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const response = await base44.functions.invoke('search-films', { query: backendQuery });
      setResults(response.data?.results || []);
    } catch (e) {
      setResults([]);
      setError(e.response?.data?.error || 'Film aranamadı, tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    const text = query.trim();
    if (text.length < 2) return;
    runSearch(text, text);
  };

  return (
    <section className="mx-auto w-full max-w-2xl px-4">
      <form onSubmit={submit} className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setError(''); }}
            placeholder="Film adı yaz (ör. Cehennem Melekleri 2)"
            autoComplete="off"
            enterKeyHint="search"
            className="h-12 w-full rounded-2xl border border-white/12 bg-black/50 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/30"
          />
        </div>
        <button
          type="submit"
          disabled={query.trim().length < 2 || loading}
          className="flex h-12 shrink-0 items-center gap-1.5 rounded-2xl px-4 text-sm font-black text-black active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#ffd9cf,#ef4343 60%,#b91c1c)' }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Ara
        </button>
      </form>

      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((entry) => (
          <button
            key={entry.label}
            type="button"
            onClick={() => runSearch(entry.label, entry.query)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition active:scale-95 ${
              category === entry.label
                ? 'border-[#ef4343]/70 bg-[#ef4343]/80 text-black'
                : 'border-white/20 bg-white/5 text-white/70'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-2 text-[11px] font-semibold text-[#ff9a9a]">{error}</p>}

      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map((item) => (
            <FilmSearchResultRow
              key={item.video_id}
              item={item}
              canMod
              onPick={() => onPick?.({ videoId: item.video_id, title: item.title })}
            />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <p className="mt-2 text-[11px] text-white/50">Film bulunamadı. Adını tam yazıp tekrar dene.</p>
      )}
      {!searched && !loading && (
        <p className="mt-2 text-[11px] text-white/40">Film seç, uygulamanın içinde oynasın.</p>
      )}
    </section>
  );
}