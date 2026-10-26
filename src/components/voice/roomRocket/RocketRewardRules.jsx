import React from 'react';
import { LEVEL_VIPS, TARGET_LABELS } from '@/components/voice/roomRocket/rocketArtwork';

export default function RocketRewardRules({ onClose }) {
  return <div className="room-rocket-rules bg-slot-panel text-slot-text">
    <h3 className="mb-2 font-heading text-lg font-bold text-slot-gold">Roket nasıl dolar?</h3>
    <p>Odaya gönderilen hediyelerin coin değeri rokete eklenir.</p>
    <p className="my-2">Hedefler: {TARGET_LABELS.join(' → ')}. LVL 4 bitince yeniden LVL 1 başlar; artan değer sonraki rokete aktarılır.</p>
    <p>Her dolumda bu roket turunun hediye sıralamasındaki ilk dört kişi 1.000, 750, 500 ve 250 coinin roket seviyesiyle çarpılmış hâlini kazanır. Sıralama Türkiye saatiyle 00.00’da ve dört roket tamamlandığında sıfırlanır; yeni hediyelerle profiller ve isimler yeniden oluşur.</p>
    <p className="my-2">1. sıradaki kişi ayrıca VIP kazanır: {LEVEL_VIPS.map((vip, index) => `LVL ${index + 1} → VIP${vip}`).join(', ')}.</p>
    <p className="my-2">Diğer hediye gönderenler arasından rastgele en fazla 10 farklı kişiye 100’er coin verilir. Aynı dolumda bir kişi iki ödül alamaz.</p>
    <button type="button" onClick={onClose} className="mt-2 rounded-full bg-slot-gold px-5 py-2 font-bold text-slot-bg">TAMAM</button>
  </div>;
}