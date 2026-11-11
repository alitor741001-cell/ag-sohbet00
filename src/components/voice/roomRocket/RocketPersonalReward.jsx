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
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    // Ödül sunucuda bir kez yazılır; Kabul Et yalnızca bakiyeyi tazeler ve kartı kapatır.
    // Bakiye okunamazsa da kart kapanır: ekranda takılı kalmaz, bakiye arka planda güncellenir.
    const response = await base44.functions.invoke('voice-room', { action: 'gift-state', room_id: roomId }).catch(() => null);
    const coins = response?.data?.coins;
    if (response?.data?.ok && Number.isFinite(coins) && user?.id) publishWalletCoins(user.id, coins);
    onAccept();
  };
  return <div className="rocket-personal-reward">
    <div className="rocket-personal-vehicle">
      {src ? <Image src={src} alt={`LVL ${level} roketi`} fittingType="fit" loading="eager" className="rocket-personal-image" /> : <Loader2 className="h-8 w-8 animate-spin text-slot-gold" />}
    </div>
    <div className="rocket-personal-card">
      <p className="rocket-personal-level">LVL {level} ROKET ÖDÜLÜ</p>
      <h2 className="rocket-personal-heading">Kazandın!</h2>
      <output className="rocket-personal-amount" aria-label={`${award.amount} coin kazandın`}>{award.amount.toLocaleString('tr-TR')} <span>COIN</span></output>
      {award.vip > 0 && <p className="rocket-personal-vip">+ VIP{award.vip} hediye</p>}
      <p className="rocket-personal-status" role="status">{error || (!award.paid ? 'Ödülün bakiyene ekleniyor…' : 'Ödülün coin bakiyene aktarıldı.')}</p>
      <button type="button" className="rocket-personal-accept" onClick={accept} disabled={saving} aria-busy={saving}>
        {saving && <Loader2 className="h-5 w-5 animate-spin" />}{saving ? 'BAKİYE YENİLENİYOR…' : 'KABUL ET'}
      </button>
    </div>
  </div>;
}