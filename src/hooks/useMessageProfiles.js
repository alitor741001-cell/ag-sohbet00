import { useEffect, useMemo, useState } from 'react';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { base44 } from '@/api/base44Client';

/**
 * Profil bilgileri uygulamada tek bir yerde tutulur: kaç bileşen kullanırsa kullansın tek
 * realtime aboneliği ve tek istek havuzu çalışır. Bilinen kişi için tekrar sorgu yapılmaz,
 * bir değişiklik yalnızca o kişiyi gösteren bileşenleri yeniden çizer.
 */
const profiles = new Map();
const fetchedAt = new Map();
const PROFILE_TTL_MS = 60000;
const listeners = new Map(); // dinleyici -> izlediği kimlikler
let pending = new Set();
let subscription = null;
let batchTimer = null;
let refreshTimer = null;
const inFlight = new Set();
const EMPTY = {};

const notify = (ids) => {
  if (!ids.length) return;
  const touched = new Set(ids);
  listeners.forEach((watched, listener) => {
    for (const id of watched) if (touched.has(id)) { listener(); return; }
  });
};

const flush = async () => {
  batchTimer = null;
  refreshTimer = null;
  const ids = [...pending].filter((id) => !inFlight.has(id)).slice(0, 100);
  if (!ids.length || !listeners.size) return;
  ids.forEach((id) => { pending.delete(id); inFlight.add(id); });
  try {
    const response = await base44.functions.invoke('user-profile', { user_ids: ids });
    const found = response?.data?.data || response?.data || {};
    ids.forEach((id) => {
      profiles.set(id, found[id] || { account_status: 'deleted' });
      fetchedAt.set(id, Date.now());
    });
  } catch {
    // İstek aksarsa kimlikler beklemede kalır; bir sonraki turda yeniden denenir.
    ids.forEach((id) => pending.add(id));
    return;
  } finally {
    ids.forEach((id) => inFlight.delete(id));
  }
  notify(ids);
  if (pending.size && listeners.size && !batchTimer) batchTimer = window.setTimeout(flush, 60);
};

// Eksik profiller hemen, bilinen profil tazelemeleri toplanarak istenir.
const requestMissing = (ids) => {
  ids.filter((id) => !inFlight.has(id)).forEach((id) => pending.add(id));
  if (!batchTimer && !refreshTimer) batchTimer = window.setTimeout(flush, 60);
};

const requestRefresh = (ids) => {
  if (!ids.length) return;
  ids.forEach((id) => pending.add(id));
  if (batchTimer) return;
  if (!refreshTimer) refreshTimer = window.setTimeout(flush, 1200);
};

const ensureSubscription = () => {
  if (subscription) return;
  const off = subscribeEntity('User', (event) => {
    const id = event.data?.id || event.id;
    if (id && [...listeners.values()].some((ids) => ids.has(id))) requestRefresh([id]);
  });
  const offVip = subscribeEntity('VipAppearance', (event) => {
    const id = event.data?.owner_id;
    if (id && [...listeners.values()].some((ids) => ids.has(id))) requestRefresh([id]);
  });
  const refreshWatched = () => {
    if (document.visibilityState === 'hidden') return;
    const ids = [...new Set([...listeners.values()].flatMap((watched) => [...watched]))];
    requestRefresh(ids.filter((id) => Date.now() - (fetchedAt.get(id) || 0) >= PROFILE_TTL_MS));
  };
  // VIP kozmetiği takılıp çıkarılınca görünüm beklemeden tazelenir.
  const refreshLooks = () => {
    if (document.visibilityState === 'hidden') return;
    const ids = [...new Set([...listeners.values()].flatMap((watched) => [...watched]))];
    if (!ids.length) return;
    ids.forEach((id) => pending.add(id));
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
    if (!batchTimer) batchTimer = window.setTimeout(flush, 60);
  };
  window.addEventListener('online', refreshWatched);
  window.addEventListener('vip-cosmetics-changed', refreshLooks);
  document.addEventListener('visibilitychange', refreshWatched);
  const expiryRefresh = window.setInterval(refreshWatched, PROFILE_TTL_MS);
  subscription = () => {
    off(); offVip();
    window.clearInterval(expiryRefresh);
    window.removeEventListener('vip-cosmetics-changed', refreshLooks);
    window.removeEventListener('online', refreshWatched);
    document.removeEventListener('visibilitychange', refreshWatched);
  };
};

export default function useMessageProfiles(userIds) {
  const key = [...new Set((userIds || []).filter(Boolean))].sort().join(',');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!key) return undefined;
    const ids = key.split(',');
    ensureSubscription();
    setVersion((value) => value + 1);
    // Hafızadaki profiller beklemeden gösterilir; yalnızca eksikler sunucudan istenir.
    requestMissing(ids.filter((id) => !profiles.has(id) || Date.now() - (fetchedAt.get(id) || 0) >= PROFILE_TTL_MS));
    const listener = () => setVersion((value) => value + 1);
    listeners.set(listener, new Set(ids));
    return () => {
      listeners.delete(listener);
      if (!listeners.size) {
        subscription?.(); subscription = null;
        window.clearTimeout(batchTimer); window.clearTimeout(refreshTimer);
        batchTimer = null; refreshTimer = null; pending.clear();
        // Preserve a small warm cache, not every profile ever visited.
        while (profiles.size > 1000) {
          const oldest = profiles.keys().next().value;
          profiles.delete(oldest); fetchedAt.delete(oldest);
        }
      }
    };
  }, [key]);

  return useMemo(() => {
    if (!key) return EMPTY;
    const result = {};
    key.split(',').forEach((id) => { if (profiles.has(id)) result[id] = profiles.get(id); });
    return result;
  }, [key, version]);
}