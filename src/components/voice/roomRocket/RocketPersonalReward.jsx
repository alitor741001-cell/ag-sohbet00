import React, { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { publishWalletCoins } from '@/hooks/useWalletCoinsLive';
import useRocketPng from '@/components/voice/roomRocket/useRocketPng';
import '@/components/voice/roomRocket/rocketPersonalReward.css';

export default function RocketPersonalReward({ level, award, roomId, onAccept }) {
  const { user } = useCurrentUser();
  const src = useRocketPng(level);
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
  return <div className="rocket-personal-reward">
    <div className="rocket-personal-vehicle">
      {src ? <Image src={src} alt={`LVL ${level} roketi`} fittingType="fit" loading="eager" className="rocket-personal-image" /> : <Loader2 className="h-8 w-8 animate-spin text-slot-gold" />}
    </div>
    <div className="rocket-personal-card">
      <p className="rocket-personal-level">LVL {level} ROKET ÖDÜLÜ</p>
      <h2 className="rocket-personal-heading">Kazandın!</h2>
      <output className="rocket-personal-amount" aria-label={`${award.amount} coin kazandın`}>{award.amount.toLocaleString('tr-TR')} <span>COIN</span></output>
      <p className="rocket-personal-status" role="status">{error || (!award.paid ? 'Ödülün bakiyene ekleniyor…' : 'Ödülün coin bakiyene aktarıldı.')}</p>
      <button type="button" className="rocket-personal-accept" onClick={accept} disabled={!award.paid || saving} aria-busy={saving}>
        {saving && <Loader2 className="h-5 w-5 animate-spin" />}{saving ? 'BAKİYE YENİLENİYOR…' : 'KABUL ET'}
      </button>
    </div>
  </div>;
}