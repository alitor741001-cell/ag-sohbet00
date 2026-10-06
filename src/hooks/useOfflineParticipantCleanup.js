import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Görünmeyen kişi bu sürenin sonunda odadan çıkarılır; kontrol aralığı bilinçli olarak seyrek.
const OFFLINE_LIMIT_MS = 3 * 60 * 1000;
const CHECK_INTERVAL_MS = 30000;

/**
 * Oda sahibi için çevrim dışı temizliği: 3 dakikadır görünmeyen katılımcı odadan
 * sessizce çıkarılır (yumuşak çıkarma). Yasak kaydı, bildirim ve listeye ekleme olmaz.
 */
export default function useOfflineParticipantCleanup({ enabled, roomId, participants, exemptIds = [] }) {
  const idsKey = (participants || []).map((person) => person.user_id).filter(Boolean).sort().join(',');
  const exemptKey = [...exemptIds].sort().join(',');

  useEffect(() => {
    if (!enabled || !roomId || !idsKey) return undefined;
    const ids = idsKey.split(',');
    const exempt = new Set(exemptKey ? exemptKey.split(',') : []);

    const check = async () => {
      const records = await base44.entities.UserPresence
        .filter({ user_id: { $in: ids } }, '-created_date', ids.length)
        .catch(() => []);
      const latest = {};
      records.forEach((record) => {
        const current = latest[record.user_id];
        if (!current || new Date(record.last_seen || 0) > new Date(current.last_seen || 0)) latest[record.user_id] = record;
      });
      const now = Date.now();
      const gone = ids.filter((id) => {
        if (exempt.has(id)) return false;
        const record = latest[id];
        // Durumu hiç yazılmamış kişi odadan çıkarılmaz: bilinmeyen durum cezalandırılmaz.
        if (!record) return false;
        return !record.online || now - new Date(record.last_seen || 0).getTime() > OFFLINE_LIMIT_MS;
      });
      await Promise.allSettled(gone.map((id) =>
        base44.functions.invoke('room-presence', { action: 'kick', room_id: roomId, target_id: id, soft: true })));
    };

    check();
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [enabled, roomId, idsKey, exemptKey]);
}