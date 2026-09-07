import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import MovieCard from '@/components/movie/MovieCard';
import EmptyState from '@/components/movie/EmptyState';
import { List, Heart } from 'lucide-react';

export default function MyList() {
  const { user } = useCurrentUser();
  const [list, setList] = useState([]);
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const wl = await base44.entities.Watchlist.filter({ user_id: user.id }, '-created_date', 100).catch(() => []);
      const lm = await Promise.all(wl.map((w) => base44.entities.Movie.get(w.movie_id).catch(() => null)));
      setList(lm.filter(Boolean));
      const fl = await base44.entities.Favorite.filter({ user_id: user.id }, '-created_date', 100).catch(() => []);
      const fm = await Promise.all(fl.map((w) => base44.entities.Movie.get(w.movie_id).catch(() => null)));
      setFavs(fm.filter(Boolean));
      setLoading(false);
    })();
  }, [user?.id]);

  if (loading) return <div className="p-6">Yükleniyor...</div>;

  return (
    <div className="px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-extrabold mb-4">Listem</h1>
      {list.length === 0 ? <EmptyState icon={List} title="Listeniz boş" description="Henüz listenize film eklemediniz." /> :
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-10">{list.map((m) => <MovieCard key={m.id} movie={m} />)}</div>}

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Heart className="w-5 h-5 text-red-400" /> Favorilerim</h2>
      {favs.length === 0 ? <EmptyState icon={Heart} title="Favori yok" description="Beğendiğiniz içerikleri favorilere ekleyin." /> :
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">{favs.map((m) => <MovieCard key={m.id} movie={m} />)}</div>}
    </div>
  );
}