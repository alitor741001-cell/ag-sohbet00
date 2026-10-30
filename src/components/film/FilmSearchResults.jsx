import { Loader2 } from 'lucide-react';
import FilmSearchResultRow from '@/components/player/FilmSearchResultRow';

/** Uygulama içi arama sonuçları: bir sonuç seçilince film uygulamanın üstünde oynar. */
export default function FilmSearchResults({ results, loading, error, searched, onPick }) {
  if (loading) {
    return (
      <p className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 text-[11px] text-white/50">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Filmler getiriliyor…
      </p>
    );
  }
  if (error) {
    return <p className="mx-auto w-full max-w-2xl px-4 text-[11px] font-semibold text-[#ff9a9a]">{error}</p>;
  }
  if (!searched) return null;
  if (!results.length) {
    return (
      <p className="mx-auto w-full max-w-2xl px-4 text-[11px] text-white/50">
        Film bulunamadı. Adını tam yazıp tekrar deneyin.
      </p>
    );
  }
  return (
    <section className="mx-auto w-full max-w-2xl space-y-2 px-4">
      <h2 className="text-xs font-black uppercase tracking-[0.18em] text-white/45">Sonuçlar</h2>
      {results.map((item) => (
        <FilmSearchResultRow
          key={item.video_id}
          item={item}
          canMod
          onPick={() => onPick?.({ videoId: item.video_id, title: item.title })}
        />
      ))}
    </section>
  );
}