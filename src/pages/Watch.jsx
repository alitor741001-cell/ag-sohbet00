import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import VideoPlayer from '@/components/player/VideoPlayer';
import { Loader2, ArrowLeft, Star, Calendar, Clock, Plus, Heart, Users } from 'lucide-react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { toast } from '@/components/ui/use-toast';

export default function Watch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inList, setInList] = useState(false);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    base44.entities.Movie.get(id).then((m) => { setMovie(m); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    base44.entities.Watchlist.filter({ user_id: user.id, movie_id: id }).then((items) => setInList(items.length > 0)).catch(() => {});
    base44.entities.Favorite.filter({ user_id: user.id, movie_id: id }).then((items) => setIsFav(items.length > 0)).catch(() => {});
  }, [user?.id, id]);

  const toggleList = async () => {
    try {
      if (inList) {
        const items = await base44.entities.Watchlist.filter({ user_id: user.id, movie_id: id });
        if (items[0]) await base44.entities.Watchlist.delete(items[0].id);
        setInList(false); toast({ title: 'Listeden çıkarıldı' });
      } else {
        await base44.entities.Watchlist.create({ user_id: user.id, movie_id: id });
        setInList(true); toast({ title: 'Listeye eklendi' });
      }
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  const toggleFav = async () => {
    try {
      if (isFav) {
        const items = await base44.entities.Favorite.filter({ user_id: user.id, movie_id: id });
        if (items[0]) await base44.entities.Favorite.delete(items[0].id);
        setIsFav(false); toast({ title: 'Favorilerden çıkarıldı' });
      } else {
        await base44.entities.Favorite.create({ user_id: user.id, movie_id: id });
        setIsFav(true); toast({ title: 'Favorilere eklendi' });
      }
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
  if (!movie) return <div className="flex flex-col items-center justify-center min-h-screen"><p className="text-muted-foreground mb-4">Film bulunamadı</p><button onClick={() => navigate('/')} className="text-purple-400">Ana sayfa</button></div>;

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white mb-4"><ArrowLeft className="w-4 h-4" /> Geri</button>
        <div className="aspect-video rounded-2xl overflow-hidden bg-black mb-4">
          <VideoPlayer src={movie.video_url} poster={movie.backdrop_url} />
        </div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{movie.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {movie.year && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {movie.year}</span>}
              {movie.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {Math.floor(movie.duration / 60)}s {movie.duration % 60}dk</span>}
              {movie.rating > 0 && <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400" /> {movie.rating}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleList} className={`w-10 h-10 rounded-full flex items-center justify-center ${inList ? 'bg-purple-600 text-white' : 'bg-white/10 text-white'}`}><Plus className="w-5 h-5" /></button>
            <button onClick={toggleFav} className={`w-10 h-10 rounded-full flex items-center justify-center ${isFav ? 'bg-red-600 text-white' : 'bg-white/10 text-white'}`}><Heart className="w-5 h-5" /></button>
            <button onClick={() => navigate('/oda-kur', { state: { movieId: id } })} className="px-4 h-10 rounded-full bg-purple-600 text-white text-sm font-medium flex items-center gap-2 hover:bg-purple-700"><Users className="w-4 h-4" /> Oda Kur</button>
          </div>
        </div>
        {movie.description && <p className="text-muted-foreground mb-4">{movie.description}</p>}
        {movie.cast?.length > 0 && <div className="mb-4"><h3 className="font-semibold text-white mb-2">Oyuncular</h3><p className="text-sm text-muted-foreground">{movie.cast.join(', ')}</p></div>}
        {movie.director && <div className="mb-4"><h3 className="font-semibold text-white mb-2">Yönetmen</h3><p className="text-sm text-muted-foreground">{movie.director}</p></div>}
      </div>
    </div>
  );
}