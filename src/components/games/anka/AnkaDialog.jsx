import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatCoins } from '@/components/games/anka/ankaConfig';
export default function AnkaDialog({ kind, onClose, game, onBuy }) {
  return <Dialog open={!!kind} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="anka-dialog bg-slot text-slot-text border-slot-gold font-body">
      <DialogHeader><DialogTitle className="text-slot-gold">{kind === 'buy' ? 'BONUS SATIN AL' : kind === 'prize' ? game.prize?.title : 'ANKA KUŞU · NASIL OYNANIR'}</DialogTitle>
        <DialogDescription className="text-slot-text">{kind === 'buy' ? '15 Anka turu, ortak coin bakiyenle oynanır.' : kind === 'prize' ? 'Kazancın coin bakiyene işlendi.' : 'Üç makara, 45 kazanma yolu. Tüm tutarlar uygulama coinidir.'}</DialogDescription></DialogHeader>
      {kind === 'help' && <div className="space-y-3 text-sm">
        <p>Solda 3, ortada 5, sağda 3 sembol vardır. Üç makarada aynı sembol gelirse satırdan bağımsız kazanırsın.</p>
        <p>Her eşleşen yol, toplam bahsin kadeh için %12, fener için %18, kese için %30, altın için %120, Anka için %200 değerini öder.</p>
        <p>En az 3 yumurta, 8 ücretsiz Anka turu verir; bonus sırasında yeniden kazanılabilir.</p>
        <p>Üç makarada Anka eşleşirse ayrıca MINI (25×), MINOR (50×), MAJOR (150×) veya GRAND (1000×) ödülü kazanılır.</p>
        <p>Bahis kademesi ×20 toplam tur bedelidir. Bonus boyunca bahis değişmez. AUTO otomatik oynatır; STOP yalnızca animasyonu hızlandırır, sonucu değiştirmez.</p>
      </div>}
      {kind === 'buy' && <><p className="text-center text-2xl font-bold text-slot-gold">{formatCoins(game.session_price)} COIN</p><button className="anka-confirm" disabled={game.busy || game.free_spins > 0} onClick={onBuy}>15 TURU BAŞLAT</button></>}
      {kind === 'prize' && <><p className="text-center text-3xl font-bold text-slot-gold">{formatCoins(game.prize?.amount)} COIN</p><button className="anka-confirm" onClick={onClose}>KABUL ET</button></>}
    </DialogContent>
  </Dialog>;
}