import { useEffect, useState } from 'react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import GiftBoardContent from '@/components/voice/GiftBoardContent';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';

/** Hediye Tahtası: hediye seçimi (alt panel) ve tam ekran "Coins Yükle" mağazası. */
export default function GiftBoard({ open, onClose, coins, ...props }) {
  const [view, setView] = useState('gifts');

  useEffect(() => { if (open) setView('gifts'); }, [open]);

  return (
    <>
      <VoiceSheet open={open && view === 'gifts'} onClose={onClose} title="Hediye Tahtası">
        <GiftBoardContent {...props} coins={coins} onOpenCoins={() => setView('coins')} />
      </VoiceSheet>
      <CoinPurchasePanel open={open && view === 'coins'} coins={coins} onBack={() => setView('gifts')} />
    </>
  );
}