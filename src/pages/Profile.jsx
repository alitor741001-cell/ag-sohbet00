import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import ProfileFrame from '@/components/ProfileFrame';
import RoleBadge from '@/components/RoleBadge';
import ProfileTabs from '@/components/profile/ProfileTabs';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { Loader2 } from 'lucide-react';

export default function Profile() {
  const { user, loading, updateUser } = useCurrentUser();
  const [watchlist, setWatchlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('watchlist');

  useEffect(() => {
    if (!user) return;
    base44.entities.Watchlist.filter({ user_id: user.id }).then(async (items) => {
      const enriched = await Promise.all((items || []).map(async (w) => {
        try { return { ...w, movie: await base44.entities.Movie.get(w.movie_id) }; } catch (err) { return w; }
      }));
      setWatchlist(enriched);
    }).catch(() => {});
    base44.entities.Favorite.filter({ user_id: user.id }).then(async (items) => {
      const enriched = await Promise.all((items || []).map(async (f) => {
        try { return { ...f, movie: await base44.entities.Movie.get(f.movie_id) }; } catch (err) { return f; }
      }));
      setFavorites(enriched);
    }).catch(() => {});
  }, [user?.id]);

  if (loading || !user) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 max-w-5xl mx-auto">
      <ProfileHeader user={user} updateUser={updateUser} />
      <ProfileTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        watchlist={watchlist}
        favorites={favorites}
        user={user}
        updateUser={updateUser}
      />
    </div>
  );
}