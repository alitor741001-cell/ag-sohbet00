import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import pkApi from '@/lib/pkApi';
import subscribeEntity from '@/components/data/entitySubscriptions';

// Bekleyen davet bu süreden sonra ekrana gelmez: eski davetler kendiliğinden düşer.
const INVITE_TTL_MS = 10 * 60 * 1000;

/**
 * Kişiye gelen görüntülü PK daveti: hangi ekranda olursa olsun anlık okunur.
 * Davet bildirim kaydına yazılmaz, doğrudan ekrana kart olarak gelir.
 */
export default function usePkInvite(userId) {
  const [invite, setInvite] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const page = await base44.entities.PkMatch.filter(
      { guest_id: userId, accepted: false, status: { $in: ['invite', 'live'] } },
      { sort: '-created_date', limit: 1 },
    );
    const record = page?.items?.[0] || null;
    const age = record?.created_date ? Date.now() - new Date(record.created_date).getTime() : 0;
    setInvite(record && age < INVITE_TTL_MS ? record : null);
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    load().catch(() => null);
    const off = subscribeEntity('PkMatch', (event) => {
      const data = event?.data;
      if (data?.guest_id && data.guest_id !== userId) return;
      load().catch(() => null);
    });
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') load().catch(() => null);
    }, 5000);
    return () => { off?.(); window.clearInterval(timer); };
  }, [userId, load]);

  const answer = async (action) => {
    if (!invite?.id) return null;
    setBusy(true);
    try {
      const data = await pkApi(action, { id: invite.id });
      setInvite(null);
      return data;
    } finally {
      setBusy(false);
    }
  };

  return { invite, busy, accept: () => answer('accept'), decline: () => answer('decline') };
}