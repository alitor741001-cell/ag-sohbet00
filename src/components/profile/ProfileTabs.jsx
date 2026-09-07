import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Heart, Settings, Star, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

const tabs = [
  { id: 'watchlist', label: 'Listem', icon: Film },
  { id: 'favorites', label: 'Favoriler', icon: Heart },
  { id: 'settings', label: 'Ayarlar', icon: Settings },
];

export default function ProfileTabs({ activeTab, setActiveTab, watchlist, favorites, user, updateUser }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);

  const removeFromList = async (id, entity) => {
    try { await base44.entities[entity].delete(id); toast({ title: 'Listeden çıkarıldı' }); }
    catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  const saveSettings = async () => {
    setSaving(true);
    try { await updateUser({ full_name: fullName, username }); toast({ title: 'Profil güncellendi' }); }
    catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === t.id ? 'bg-purple-600 text-white' : 'bg-white/5 text-muted-foreground'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'watchlist' && (
        <div>
          {watchlist.length === 0 ? <p className="text-center text-muted-foreground py-12">Listeniz boş</p> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {watchlist.map((w) => (
                <div key={w.id} className="group relative">
                  <button onClick={() => w.movie && navigate(`/izle/${w.movie_id}`)} className="block w-full text-left">
                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                      {w.movie?.poster_url ? <img src={w.movie.poster_url} alt={w.movie?.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Film className="w-8 h-8 text-muted-foreground" /></div>}
                    </div>
                    <p className="text-sm text-white mt-2 truncate">{w.movie?.title || 'Bilinmeyen'}</p>
                  </button>
                  <button onClick={() => removeFromList(w.id, 'Watchlist')} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? <p className="text-center text-muted-foreground py-12">Favori yok</p> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {favorites.map((f) => (
                <div key={f.id} className="group relative">
                  <button onClick={() => f.movie && navigate(`/izle/${f.movie_id}`)} className="block w-full text-left">
                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                      {f.movie?.poster_url ? <img src={f.movie.poster_url} alt={f.movie?.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Film className="w-8 h-8 text-muted-foreground" /></div>}
                    </div>
                    <p className="text-sm text-white mt-2 truncate">{f.movie?.title || 'Bilinmeyen'}</p>
                  </button>
                  <button onClick={() => removeFromList(f.id, 'Favorite')} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-md space-y-4">
          <div><Label className="text-muted-foreground">Ad Soyad</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><Label className="text-muted-foreground">Kullanıcı adı</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} /></div>
          <Button onClick={saveSettings} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
        </div>
      )}
    </div>
  );
}