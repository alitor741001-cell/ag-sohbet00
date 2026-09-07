import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import MovieCard from '@/components/movie/MovieCard';
import EmptyState from '@/components/movie/EmptyState';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  const [sp] = useSearchParams();
  const q = sp.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Movie.filter({ published: true }, '-views', 300).then((all) => {
      if (!q) { setResults(all); setLoading(false); return; }
      const ql = q.toLowerCase();
      setResults(all.filter((m) => m.title?.toLowerCase().includes(ql) || m.genres?.some((g) => g.toLowerCase().includes(ql)) || m.cast?.some((c) => c.toLowerCase().includes(ql))));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [q]);

  return (
    <div className="px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-extrabold mb-4 flex items-center gap-2"><SearchIcon className="w-6 h-6" /> {q ? `"${q}" sonuçları` : 'Tüm İçerikler'}</h1>
      {loading ? <p className="text-muted-foreground">Aranıyor...</p> :
       results.length === 0 ? <EmptyState icon={SearchIcon} title="Sonuç bulunamadı" description={`"${q}" için içerik bulunamadı.`} /> :
       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">{results.map((m) => <MovieCard key={m.id} movie={m} />)}</div>}
    </div>
  );
}