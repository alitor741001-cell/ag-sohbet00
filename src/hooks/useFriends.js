import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';

/**
 * Arkadaşlık ilişkileri uygulamada tek bir yerden yönetilir: hook'u kaç bileşen kullanırsa
 * kullansın tek realtime aboneliği ve tek yedek yoklama çalışır. Veri bileşenler arasında
 * paylaşıldığı için sayfaya dönüldüğünde liste anında hazır olur, aynı sorgu tekrarlanmaz.
 */
const store = {
  userId: null,
  relations: [],
  loading: true,
  listeners: new Set(),
  unsubscribe: null,
  interval: null,
  onOnline: null,
};

const publish = (patch) => {
  Object.assign(store, patch);
  store.listeners.forEach((listener) => listener({ relations: store.relations, loading: store.loading }));
};

const applyEvent = (current, event) => {
  if (event.type === 'create') return current.some((relation) => relation.id === event.id) ? current : [event.data, ...current];
  if (event.type === 'update') return current.map((relation) => (relation.id === event.id ? { ...relation, ...event.data } : relation));
  return current.filter((relation) => relation.id !== event.id);
};

const load = async () => {
  if (!store.userId) return;
  try {
    const friendships = await base44.entities.Friendship.filter({ members: store.userId }, '-updated_date', 200);
    publish({ relations: friendships });
  } catch {}
  publish({ loading: false });
};

const stop = () => {
  if (store.unsubscribe) { store.unsubscribe(); store.unsubscribe = null; }
  if (store.interval) { window.clearInterval(store.interval); store.interval = null; }
  if (store.onOnline) { window.removeEventListener('online', store.onOnline); store.onOnline = null; }
};

const start = (userId) => {
  if (store.userId === userId && store.unsubscribe) return;
  stop();
  store.userId = userId;
  store.loading = true;
  load();
  store.unsubscribe = base44.entities.Friendship.subscribe((event) => {
    publish({ relations: applyEvent(store.relations, event) });
  });
  store.onOnline = () => load();
  window.addEventListener('online', store.onOnline);
  // Yoklama yedeği — realtime kaçırsa diye; sekme arkadayken durur ve tüm bileşenler aynı turu paylaşır.
  store.interval = window.setInterval(() => { if (document.visibilityState !== 'hidden') load(); }, 60000);
};

export default function useFriends() {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  // İlk çizim hafızadaki veriyle yapılır: sayfa değişiminde boş liste görünmez.
  const [state, setState] = useState({ relations: store.relations, loading: store.loading });

  useEffect(() => {
    if (!user?.id) return undefined;
    store.listeners.add(setState);
    start(user.id);
    setState({ relations: store.relations, loading: store.loading });
    return () => {
      store.listeners.delete(setState);
      // Son bileşen kapandığında bağlantılar kapanır: arka planda boşa çalışan dinleyici kalmaz.
      if (!store.listeners.size) { stop(); store.userId = null; }
    };
  }, [user?.id]);

  const reload = useCallback(() => load(), []);

  const invoke = async (payload) => {
    try {
      const res = await base44.functions.invoke('friend-service', payload);
      if (['request', 'respond', 'unfriend', 'block', 'unblock'].includes(payload.action)) await reload();
      window.dispatchEvent(new Event('social-badges-refresh'));
      return res.data;
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
      throw error;
    }
  };

  return { user, relations: state.relations, loading: state.loading, reload, invoke };
}