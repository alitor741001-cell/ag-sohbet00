import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { getSeen, useSeenTick } from '@/lib/seenBadge';

const iso = (ms) => new Date(ms || 0).toISOString();

/** İstekler, sistem bildirimi ve ajans mesajları için yeni öğe sayıları.
    İlgili sayfa açıldıktan sonra sayılar sıfırlanır. */
export default function useBannerBadges(userId, relations = []) {
  const tick = useSeenTick();
  const [notes, setNotes] = useState(0);
  const [agency, setAgency] = useState(0);

  useEffect(() => {
    if (!userId) return undefined;
    const load = () => {
      base44.entities.Notification.count({ user_id: userId, read: false, created_date: { $gt: iso(getSeen('notes', userId)) } }).then(setNotes).catch(() => {});
      base44.entities.AgencyInvite.count({ invitee_id: userId, status: 'pending', created_date: { $gt: iso(getSeen('agency', userId)) } }).then(setAgency).catch(() => {});
    };
    load();
    const u1 = subscribeEntity('Notification', load);
    const u2 = subscribeEntity('AgencyInvite', load);
    const timer = setInterval(() => { if (document.visibilityState !== 'hidden') load(); }, 10000);
    return () => { u1(); u2(); clearInterval(timer); };
  }, [userId, tick]);

  const seenReq = getSeen('requests', userId);
  const requests = relations.filter((r) => r.status === 'pending' && r.recipient_id === userId && new Date(r.created_date).getTime() > seenReq).length;
  return { requests, notes, agency };
}