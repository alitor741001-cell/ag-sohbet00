import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import ProfileFrame from '@/components/ProfileFrame';
import RoleBadge from '@/components/RoleBadge';
import ReportDialog from '@/components/ReportDialog';
import { Loader2, MessageSquare, UserPlus, Flag, Film, Heart } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();
  const [profileUser, setProfileUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.entities.User.get(id);
        setProfileUser(u);
        const items = await base44.entities.Watchlist.filter({ user_id: id });
        const enriched = await Promise.all((items || []).slice(0, 12).map(async (w) => {
          try { return { ...w, movie: await base44.entities.Movie.get(w.movie_id) }; } catch (err) { return w; }
        }));
        setWatchlist(enriched);
        if (currentUser) {
          const friendships = await base44.entities.Friendship.filter({ user_id: currentUser.id, friend_id: id });
          setIsFriend(friendships.length > 0);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [id, currentUser?.id]);

  const addFriend = async () => {
    try {
      await base44.entities.Friendship.create({ user_id: currentUser.id, friend_id: id, status: 'pending' });
      toast({ title: 'Arkadaşlık isteği gönderildi' });
      setIsFriend(true);
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
  if (!profileUser) return <div className="flex flex-col items-center justify-center min-h-screen"><p className="text-muted-foreground">Kullanıcı bulunamadı</p></div>;

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 max-w-4xl mx-auto">
      <div className="relative mb-6">
        <div className="h-24 rounded-2xl bg-gradient-to-r from-purple-600/30 to-pink-600/30" />
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 px-4">
          <ProfileFrame user={profileUser} src={profileUser.avatar} size={96} />
          <div className="flex-1 text-center sm:text-left pb-2">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-xl font-bold text-white">{profileUser.full_name || profileUser.username}</h1>
              <RoleBadge user={profileUser} />
            </div>
            <p className="text-sm text-muted-foreground">@{profileUser.username}</p>
          </div>
          {currentUser?.id !== id && (
            <div className="flex gap-2 pb-2">
              {!isFriend && <button onClick={addFriend} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium flex items-center gap-1 hover:bg-purple-700"><UserPlus className="w-4 h-4" /> Ekle</button>}
              <button onClick={() => navigate('/arkadaslar')} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><MessageSquare className="w-4 h-4 text-white" /></button>
              <button onClick={() => setShowReport(true)} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><Flag className="w-4 h-4 text-red-400" /></button>
            </div>
          )}
        </div>
      </div>
      <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Film className="w-5 h-5" /> Listesi</h3>
      {watchlist.length === 0 ? <p className="text-muted-foreground text-sm">Liste boş</p> : (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {watchlist.map((w) => (
            <button key={w.id} onClick={() => w.movie && navigate(`/izle/${w.movie_id}`)} className="text-left">
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">{w.movie?.poster_url ? <img src={w.movie.poster_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Film className="w-6 h-6 text-muted-foreground" /></div>}</div>
              <p className="text-xs text-white truncate mt-1">{w.movie?.title}</p>
            </button>
          ))}
        </div>
      )}
      <ReportDialog open={showReport} onClose={() => setShowReport(false)} targetUserId={id} targetName={profileUser.full_name || profileUser.username} />
    </div>
  );
}