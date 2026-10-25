import React from 'react';
import { TARGET_LABELS } from '@/components/voice/roomRocket/rocketArtwork';

export default function RocketRewardRules({ onClose }) {
  return <div className="room-rocket-rules bg-slot-panel text-slot-text">
    <h3 className="mb-2 font-heading text-lg font-bold text-slot-gold">Roket nasıl dolar?</h3>
    <p>Odaya gönderilen hediyelerin coin değeri rokete eklenir.</p>
    <p className="my-2">Hedefler: {TARGET_LABELS.join(' → ')}. LVL 4 bitince yeniden LVL 1 başlar; artan değer sonraki rokete aktarılır.</p>
    <p>Her dolumda odanın günlük (Türkiye saatiyle 00.00’da yenilenen) hediye sıralamasındaki ilk dört kişi 1.000, 750, 500 ve 250 coinin roket seviyesiyle çarpılmış hâlini kazanır.</p>
    <p className="my-2">Diğer hediye gönderenler arasından rastgele en fazla 10 farklı kişiye 100’er coin verilir. Aynı dolumda bir kişi iki ödül alamaz.</p>
    <button type="button" onClick={onClose} className="mt-2 rounded-full bg-slot-gold px-5 py-2 font-bold text-slot-bg">TAMAM</button>
  </div>;
}