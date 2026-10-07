import { useEffect, useState } from 'react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import GiftBoardContent from '@/components/voice/GiftBoardContent';
import GiftSendButton from '@/components/voice/GiftSendButton';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';

/** Hediye Tahtası: hediye seçimi (alt panel) ve tam ekran "Coins Yükle" mağazası. */
export default function GiftBoard({ open, onClose, coins, onSend, sendDisabled, ...props }) {
  const [view, setView] = useState('gifts');

  useEffect(() => { if (open) setView('gifts'); }, [open]);

  return (
    <>
      <VoiceSheet open={open && view === 'gifts'} onClose={onClose} title="Hediye Tahtası" halfHeight>
        <GiftBoardContent {...props} coins={coins} onOpenCoins={() => setView('coins')} />
      </VoiceSheet>
      {/* Gönder düğmesi hediye kutusunun sağ alt köşesinde durur; gönderince kutu kapanır. */}
      <GiftSendButton visible={open && view === 'gifts'} disabled={sendDisabled} onSend={onSend} />
      <CoinPurchasePanel open={open && view === 'coins'} coins={coins} onBack={() => setView('gifts')} />
    </>
  );
}