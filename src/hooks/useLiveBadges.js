import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

/**
 * Sistem bildirimi ve ajans mesajı sayaçları: realtime olay geldiği an sayaç tazelenir,
 * silinen/okunan kayıt düşer. Realtime kaçarsa 5 saniyelik yoklama yedek görevi görür.
 */
export default function useLiveBadges(userId) {
  const [counts, setCounts] = useState({ notes: 0, agency: 0 });

  useEffect(() => {
    if (!userId) { setCounts({ notes: 0, agency: 0 }); return; }
    let alive = true;
    const load = async () => {
      try {
        const [notes, agency] = await Promise.all([
          base44.entities.Notification.count({ user_id: userId, read: false }),
          base44.entities.AgencyInvite.count({ invitee_id: userId, status: 'pending' }),
        ]);
        if (alive) setCounts({ notes: notes || 0, agency: agency || 0 });
      } catch {
        // Sayaç okunamazsa son değer korunur.
      }
    };
    load();
    const offNotes = subscribeEntity('Notification', (event) => {
      if (event.data?.user_id && event.data.user_id !== userId) return;
      load();
    });
    const offAgency = subscribeEntity('AgencyInvite', (event) => {
      const data = event.data;
      if (data && data.invitee_id && data.invitee_id !== userId) return;
      load();
    });
    const interval = setInterval(() => { if (document.visibilityState !== 'hidden') load(); }, 5000);
    return () => { alive = false; offNotes(); offAgency(); clearInterval(interval); };
  }, [userId]);

  return counts;
}