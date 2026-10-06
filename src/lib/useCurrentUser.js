import { useEffect, useState } from 'react';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { base44 } from '@/api/base44Client';

let cachedUser = null;
let loadingUser = true;
let loadPromise = null;
let userSubscription = null;
// Oturum doğrulaması uygulama açılışında zaten yapılır; sonucu buraya yazılır ve
// sayfalar aynı sorguyu ikinci kez beklemez.
let seededAt = 0;
const listeners = new Set();

const publish = () => listeners.forEach((listener) => listener({ user: cachedUser, loading: loadingUser }));

const connectRealtime = () => {
  if (userSubscription || !cachedUser?.id || !listeners.size) return;
  userSubscription = subscribeEntity('User', (event) => {
    if (event.type === 'update' && event.data?.id === cachedUser?.id) {
      cachedUser = { ...cachedUser, ...event.data };
      publish();
    }
  });
};

/** Oturum doğrulamasından gelen kullanıcıyı paylaşılan önbelleğe yazar (null: oturum kapandı). */
export function seedCurrentUser(user) {
  if (!user) {
    userSubscription?.(); userSubscription = null;
    cachedUser = null;
    loadingUser = false;
    seededAt = 0;
    publish();
    return;
  }
  cachedUser = user;
  loadingUser = false;
  seededAt = Date.now();
  connectRealtime();
  publish();
}

const loadUser = (force = false) => {
  // Taze önbellek varsa ağa hiç çıkılmaz — sekmeler arası geçiş anında olur.
  if (!force && cachedUser && Date.now() - seededAt < 60000) {
    loadingUser = false;
    publish();
    return Promise.resolve(cachedUser);
  }
  if (loadPromise) return loadPromise;
  loadingUser = true;
  publish();
  loadPromise = base44.auth.me()
    .then((user) => { cachedUser = user; seededAt = Date.now(); connectRealtime(); return user; })
    .catch(() => { cachedUser = null; return null; })
    .finally(() => { loadingUser = false; loadPromise = null; publish(); });
  return loadPromise;
};

export function useCurrentUser() {
  const [state, setState] = useState({ user: cachedUser, loading: loadingUser });

  useEffect(() => {
    listeners.add(setState);
    connectRealtime();
    if (loadingUser && !loadPromise) loadUser();
    else setState({ user: cachedUser, loading: loadingUser });
    return () => {
      listeners.delete(setState);
      if (!listeners.size) { userSubscription?.(); userSubscription = null; }
    };
  }, []);

  const setUser = (next) => {
    cachedUser = typeof next === 'function' ? next(cachedUser) : next;
    seededAt = Date.now();
    publish();
  };

  return { ...state, setUser, reload: () => loadUser(true) };
}

/**
 * Abonelik/paket sistemi kaldırıldı: hesabı olan herkes içeriğe erişir.
 * Yalnızca giriş yapmamış (hesabı olmayan) kullanıcı içerik göremez.
 */
export function membershipActive(user) {
  return !!user;
}