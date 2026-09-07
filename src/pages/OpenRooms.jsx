import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, Lock, Play, Film } from 'lucide-react';

export default function OpenRooms() {
  const [rooms, setRooms] = useState([]);
  const [movies, setMovies] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        // Fetch rooms - using Conversation entity as rooms since Room entity doesn't exist
        const roomList = await base44.entities.Conversation.filter({ type: 'room' }).catch(() => []);
        if (!active) return;
        const movieMap = {};
        await Promise.all((roomList || []).map(async (r) => {
          if (r.movie_id && !movieMap[r.movie_id]) {
            try { movieMap[r.movie_id] = await base44.entities.Movie.get(r.movie_id); } catch {}
          }
        }));
        if (!active) return;
        setRooms(roomList || []);
        setMovies(movieMap);
      } catch {}
      finally { if (active) setLoading(false); }
    };
    load();
    const unsub = base44.entities.Conversation.subscribe((event) => {
      if (event.type === 'delete') setRooms((prev) => prev.filter((r) => r.id !== event.id));
      else setRooms((prev) => [event.data, ...prev.filter((r) => r.id !== event.id)]);
    });
    return () => { active = false; unsub?.(); };
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen pt-20"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Açık Odalar</h1>
      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Film className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">Şu anda açık oda yok</p>
          <button onClick={() => navigate('/oda-kur')} className="text-purple-400 hover:underline text-sm">Yeni oda kur</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rooms.map((room) => {
            const movie = movies[room.movie_id];
            return (
              <button key={room.id} onClick={() => navigate(`/oda/${room.id}`)} className="group text-left">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted">
                  {movie?.poster_url ? (
                    <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Film className="w-8 h-8 text-muted-foreground" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-semibold text-sm truncate">{movie?.title || 'Bilinmeyen film'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs text-white/80"><Users className="w-3 h-3" /> {room.participants?.length || 0}</span>
                      {room.is_private && <span className="flex items-center gap-1 text-xs text-amber-400"><Lock className="w-3 h-3" /> Gizli</span>}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-purple-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}