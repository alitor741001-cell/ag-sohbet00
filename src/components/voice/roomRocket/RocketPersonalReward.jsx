import React, { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { publishWalletCoins } from '@/hooks/useWalletCoinsLive';

export default function RocketPersonalReward({ src, award, roomId, onAccept }) {
  const { user } = useCurrentUser();
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const accept = async () => {
    if (busy.current || !award.paid) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      // Payout is already idempotently credited by the server. Accept only
      // confirms the existing balance; it must never add the award again.
      const { data } = await base44.functions.invoke('voice-room', { action: 'gift-state', room_id: roomId });
      if (!data.ok || !Number.isFinite(data.coins)) throw new Error('Bakiye alınamadı.');
      publishWalletCoins(user.id, data.coins);
      onAccept();
    } catch {
      setError('Bakiye yenilenemedi. Kabul Et’e tekrar bas.');
      busy.current = false;
      setSaving(false);
    }
  };
  return <div className="rocket-celebration-frame">
    <Image src={src} alt="Roketten coins kazandın!" className="rocket-celebration-art" />
    <output className="rocket-award-amount" aria-label={`${award.amount} coin kazandın`}>{award.amount.toLocaleString('tr-TR')}</output>
    <button type="button" className="rocket-award-accept" onClick={accept} disabled={!award.paid || saving} aria-label="Kabul et" aria-busy={saving}>
      {saving && <Loader2 className="mx-auto h-6 w-6 animate-spin text-slot-bg" />}<span className="sr-only">KABUL ET</span>
    </button>
    <p className="rocket-award-status" role="status">{error || (!award.paid ? 'Ödülün bakiyene ekleniyor…' : '')}</p>
  </div>;
}