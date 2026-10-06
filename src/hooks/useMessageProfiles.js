import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Profil bilgileri uygulamada tek bir yerde tutulur: kaç bileşen kullanırsa kullansın tek
 * realtime aboneliği ve tek istek havuzu çalışır. Bilinen kişi için tekrar sorgu yapılmaz,
 * bir değişiklik yalnızca o kişiyi gösteren bileşenleri yeniden çizer.
 */
const profiles = new Map();
const listeners = new Map(); // dinleyici -> izlediği kimlikler
let pending = new Set();
let subscription = null;
let batchTimer = null;
let refreshTimer = null;
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
  const ids = [...pending];
  if (!ids.length) return;
  pending = new Set();
  try {
    const response = await base44.functions.invoke('user-profile', { user_ids: ids });
    const found = response?.data?.data || response?.data || {};
    ids.forEach((id) => profiles.set(id, found[id] || { account_status: 'deleted' }));
  } catch {
    // İstek aksarsa kimlikler beklemede kalır; bir sonraki turda yeniden denenir.
    ids.forEach((id) => pending.add(id));
    return;
  }
  notify(ids);
};

// Eksik profiller hemen, bilinen profil tazelemeleri toplanarak istenir.
const requestMissing = (ids) => {
  ids.forEach((id) => pending.add(id));
  if (!batchTimer && !refreshTimer) batchTimer = window.setTimeout(flush, 60);
};

const requestRefresh = (ids) => {
  ids.forEach((id) => pending.add(id));
  if (batchTimer) return;
  if (refreshTimer) window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(flush, 1200);
};

const ensureSubscription = () => {
  if (subscription) return;
  subscription = base44.entities.User.subscribe((event) => {
    const id = event.data?.id || event.id;
    if (id && profiles.has(id)) requestRefresh([id]);
  });
};

export default function useMessageProfiles(userIds) {
  const key = [...new Set((userIds || []).filter(Boolean))].sort().join(',');
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!key) return undefined;
    const ids = key.split(',');
    ensureSubscription();
    setVersion((value) => value + 1);
    // Hafızadaki profiller beklemeden gösterilir; yalnızca eksikler sunucudan istenir.
    requestMissing(ids.filter((id) => !profiles.has(id)));
    const listener = () => setVersion((value) => value + 1);
    listeners.set(listener, new Set(ids));
    return () => { listeners.delete(listener); };
  }, [key]);

  if (!key) return EMPTY;
  const result = {};
  key.split(',').forEach((id) => { if (profiles.has(id)) result[id] = profiles.get(id); });
  return result;
}