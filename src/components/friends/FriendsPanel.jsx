import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import ProfileFrame from '@/components/ProfileFrame';
import RoleBadge from '@/components/RoleBadge';
import { UserPlus, Check, X, MessageSquare, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

export default function FriendsPanel({ friends, requests, user }) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  const acceptRequest = async (req) => {
    try {
      await base44.entities.Friendship.update(req.id, { status: 'accepted' });
      await base44.entities.Friendship.create({ user_id: user.id, friend_id: req.user_id, status: 'accepted' });
      toast({ title: 'Arkadaşlık isteği kabul edildi' });
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  const rejectRequest = async (req) => {
    try { await base44.entities.Friendship.delete(req.id); toast({ title: 'İstek reddedildi' }); }
    catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  const searchUsers = async () => {
    if (!search.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const users = await base44.entities.User.list();
      setSearchResults(users.filter((u) => u.id !== user.id && (u.username?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase()))).slice(0, 10));
    } catch {} finally { setSearching(false); }
  };

  const sendRequest = async (targetUser) => {
    try {
      await base44.entities.Friendship.create({ user_id: user.id, friend_id: targetUser.id, status: 'pending' });
      toast({ title: 'Arkadaşlık isteği gönderildi' });
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  return (
    <div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyUp={searchUsers} placeholder="Kullanıcı ara..." className="w-full bg-white/5 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white" />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {searchResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Arama sonuçları</h3>
          <div className="space-y-2">
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <ProfileFrame user={u} src={u.avatar} size={40} />
                <div className="flex-1"><p className="text-sm font-medium text-white">{u.full_name || u.username}</p><p className="text-xs text-muted-foreground">@{u.username}</p></div>
                <button onClick={() => sendRequest(u)} className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 flex items-center gap-1"><UserPlus className="w-3 h-3" /> Ekle</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {requests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">İstekler ({requests.length})</h3>
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <ProfileFrame user={req.requester} src={req.requester?.avatar} size={40} />
                <div className="flex-1"><p className="text-sm font-medium text-white">{req.requester?.full_name || req.requester?.username}</p><p className="text-xs text-muted-foreground">@{req.requester?.username}</p></div>
                <button onClick={() => acceptRequest(req)} className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-700"><Check className="w-4 h-4 text-white" /></button>
                <button onClick={() => rejectRequest(req)} className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700"><X className="w-4 h-4 text-white" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Arkadaşlar ({friends.length})</h3>
      {friends.length === 0 ? <p className="text-center text-muted-foreground py-12">Henüz arkadaş yok</p> : (
        <div className="space-y-2">
          {friends.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10">
              <ProfileFrame user={f.friend} src={f.friend?.avatar} size={40} />
              <div className="flex-1"><p className="text-sm font-medium text-white">{f.friend?.full_name || f.friend?.username}</p><p className="text-xs text-muted-foreground">@{f.friend?.username}</p></div>
              <button onClick={() => navigate(`/kullanici/${f.friend_id}`)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><MessageSquare className="w-4 h-4 text-white" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}