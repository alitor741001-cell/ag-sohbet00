import { useEffect, useState } from 'react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import GiftBoardContent from '@/components/voice/GiftBoardContent';
import GiftSendButton from '@/components/voice/GiftSendButton';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';

/** Hediye Tahtası: hediye seçimi (alt panel) ve tam ekran "Coins Yükle" mağazası. */
export default function GiftBoard({ open, onClose, coins, onSend, sendDisabled, ...props }) {
  const [view, setView] = useState('gifts');
  // Gönderimden sonra düğme ekranda kalır: kutu kapanır ama aynı hediye arka arkaya
  // gönderilebilir. Kutu yeniden açıldığında bu kalıcılık sıfırlanır.
  const [stayVisible, setStayVisible] = useState(false);

  useEffect(() => { if (open) { setView('gifts'); setStayVisible(false); } }, [open]);

  const handleSend = () => { setStayVisible(true); onSend?.(); };

  return (
    <>
      <VoiceSheet open={open && view === 'gifts'} onClose={onClose} title="Hediye Tahtası" halfHeight>
        <GiftBoardContent {...props} coins={coins} onOpenCoins={() => setView('coins')} />
      </VoiceSheet>
      {/* Gönder düğmesi hediye kutusunun sağ alt köşesinde durur; gönderince kutu kapanır,
          düğme yerinde kalır ve seçili hediye aynı kişilere tekrar gönderilebilir. */}
      <GiftSendButton visible={(open && view === 'gifts') || stayVisible} disabled={sendDisabled} onSend={handleSend} />
      <CoinPurchasePanel open={open && view === 'coins'} coins={coins} onBack={() => setView('gifts')} />
    </>
  );
}