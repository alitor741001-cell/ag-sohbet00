import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Globe, Users, Film } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function CreateRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useCurrentUser();
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    base44.entities.Movie.list('-created_date', 100).then(setMovies).catch(() => {});
    if (location.state?.movieId) {
      base44.entities.Movie.get(location.state.movieId).then(setSelectedMovie).catch(() => {});
    }
  }, []);

  const filtered = movies.filter((m) => !search || m.title?.toLowerCase().includes(search.toLowerCase()));

  const create = async () => {
    if (!selectedMovie) { toast({ title: 'Film seçin', variant: 'destructive' }); return; }
    setCreating(true);
    try {
      const result = await base44.functions.invoke('create-room', {
        movie_id: selectedMovie.id,
        movie_title: selectedMovie.title,
        room_name: roomName || `${selectedMovie.title} odası`,
        is_private: isPrivate,
        password: isPrivate ? password : undefined,
        max_participants: maxParticipants,
      });
      toast({ title: 'Oda oluşturuldu' });
      navigate(`/oda/${result?.data?.room_id || result?.room_id}`);
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
    finally { setCreating(false); }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Oda Kur</h1>
      <div className="space-y-6">
        <div>
          <Label className="text-muted-foreground mb-2 block">Film Seç</Label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Film ara..." className="mb-3" />
          {selectedMovie ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              {selectedMovie.poster_url && <img src={selectedMovie.poster_url} alt="" className="w-12 h-16 rounded object-cover" />}
              <div className="flex-1"><p className="font-medium text-white">{selectedMovie.title}</p><p className="text-xs text-muted-foreground">{selectedMovie.year}</p></div>
              <button onClick={() => setSelectedMovie(null)} className="text-xs text-red-400">Değiştir</button>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto">
              {filtered.map((m) => (
                <button key={m.id} onClick={() => setSelectedMovie(m)} className="text-left">
                  <div className="aspect-[2/3] rounded overflow-hidden bg-muted">{m.poster_url ? <img src={m.poster_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Film className="w-4 h-4 text-muted-foreground" /></div>}</div>
                  <p className="text-xs text-white truncate mt-1">{m.title}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div><Label className="text-muted-foreground">Oda Adı</Label><Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder={`${selectedMovie?.title || 'Film'} odası`} /></div>
        <div>
          <Label className="text-muted-foreground mb-2 block">Gizlilik</Label>
          <div className="flex gap-2">
            <button onClick={() => setIsPrivate(false)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border ${!isPrivate ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-border text-muted-foreground'}`}><Globe className="w-4 h-4" /> Herkese Açık</button>
            <button onClick={() => setIsPrivate(true)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border ${isPrivate ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-border text-muted-foreground'}`}><Lock className="w-4 h-4" /> Gizli</button>
          </div>
        </div>
        {isPrivate && <div><Label className="text-muted-foreground">Oda Şifresi</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifre" /></div>}
        <div><Label className="text-muted-foreground">Maksimum Katılımcı</Label><Input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 10)} min={2} max={50} /></div>
        <Button onClick={create} disabled={creating || !selectedMovie} className="w-full bg-purple-600 hover:bg-purple-700 text-white">{creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Odayı Oluştur</Button>
      </div>
    </div>
  );
}