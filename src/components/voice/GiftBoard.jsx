import { useEffect, useState } from 'react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import GiftBoardContent from '@/components/voice/GiftBoardContent';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';

/** Hediye Tahtası: hediye seçimi ile "Coins Yükle" panelini aynı boyutta gösterir. */
export default function GiftBoard({ open, onClose, coins, ...props }) {
  const [view, setView] = useState('gifts');

  useEffect(() => { if (open) setView('gifts'); }, [open]);

  return (
    <VoiceSheet open={open} onClose={onClose} title={view === 'coins' ? 'Coins Yükle' : 'Hediye Tahtası'}>
      {view === 'coins' ? (
        <CoinPurchasePanel coins={coins} onBack={() => setView('gifts')} />
      ) : (
        <GiftBoardContent {...props} coins={coins} onOpenCoins={() => setView('coins')} />
      )}
    </VoiceSheet>
  );
}