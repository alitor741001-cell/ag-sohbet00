import { useCallback, useEffect, useState } from 'react';
import subscribeEntity from '@/components/data/entitySubscriptions';
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
  onRefresh: null,
  loadedAt: 0,
  pendingLoad: null,
};

// Arkadaşlık başka bir ekrandan değiştirildiğinde (ör. sohbet ayarlarından arkadaş silme)
// liste beklemeden tazelenir: ana sayfa kartlarındaki "Ekli" işareti anında kalkar.
const REFRESH_EVENT = 'friends-refresh';

/** Arkadaşlık durumu değiştiğinde çağrılır: liste açık ekranlarda hemen, sonraki açılışta yeniden okunur. */
export function refreshFriends() {
  store.loadedAt = 0;
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

const publish = (patch) => {
  Object.assign(store, patch);
  store.listeners.forEach((listener) => listener({ relations: store.relations, loading: store.loading }));
};

const applyEvent = (current, event) => {
  if (event.type === 'create') return current.some((relation) => relation.id === event.id) ? current : [event.data, ...current];
  if (event.type === 'update') return current.map((relation) => (relation.id === event.id ? { ...relation, ...event.data } : relation));
  return current.filter((relation) => relation.id !== event.id);
};

const load = () => {
  const userId = store.userId;
  if (!userId) return Promise.resolve();
  if (store.pendingLoad?.userId === userId) return store.pendingLoad.promise;
  const promise = (async () => {
    try {
      const friendships = await base44.entities.Friendship.filter({ members: userId }, '-updated_date', 200);
      if (store.userId !== userId) return;
      store.loadedAt = Date.now();
      publish({ relations: friendships });
    } catch {}
    if (store.userId === userId) publish({ loading: false });
  })();
  store.pendingLoad = { userId, promise };
  promise.finally(() => { if (store.pendingLoad?.promise === promise) store.pendingLoad = null; });
  return promise;
};

const stop = () => {
  if (store.unsubscribe) { store.unsubscribe(); store.unsubscribe = null; }
  if (store.interval) { window.clearInterval(store.interval); store.interval = null; }
  if (store.onOnline) { window.removeEventListener('online', store.onOnline); store.onOnline = null; }
  if (store.onRefresh) { window.removeEventListener(REFRESH_EVENT, store.onRefresh); store.onRefresh = null; }
};

const start = (userId) => {
  if (store.userId === userId && store.unsubscribe) return;
  stop();
  if (store.userId !== userId) {
    store.relations = []; store.loadedAt = 0;
  }
  store.userId = userId;
  store.loading = !store.loadedAt;
  if (Date.now() - store.loadedAt >= 60000) load();
  store.unsubscribe = subscribeEntity('Friendship', (event) => {
    const id = event.data?.id || event.id;
    const known = store.relations.some((relation) => relation.id === id);
    const data = event.data;
    if (!known && !(data?.members || []).includes(userId) && data?.requester_id !== userId && data?.recipient_id !== userId) return;
    publish({ relations: applyEvent(store.relations, { ...event, id }) });
  });
  store.onOnline = () => load();
  window.addEventListener('online', store.onOnline);
  store.onRefresh = () => load();
  window.addEventListener(REFRESH_EVENT, store.onRefresh);
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
      if (!store.listeners.size) stop();
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