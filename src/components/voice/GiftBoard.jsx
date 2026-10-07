import { useEffect, useState } from 'react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import GiftBoardContent from '@/components/voice/GiftBoardContent';
import GiftSendButton from '@/components/voice/GiftSendButton';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';

/** Hediye Tahtası: hediye seçimi (alt panel) ve tam ekran "Coins Yükle" mağazası. */
export default function GiftBoard({ open, onClose, coins, onSend, sendDisabled, multiplier = 1, onMultiplier, ...props }) {
  const [view, setView] = useState('gifts');
  // Gönderimden sonra düğme ekranda kalır: kutu kapanır ama aynı hediye arka arkaya
  // gönderilebilir. Kutu yeniden açıldığında bu kalıcılık sıfırlanır.
  const [stayVisible, setStayVisible] = useState(false);

  useEffect(() => { if (open) { setView('gifts'); setStayVisible(false); } }, [open]);

  const handleSend = () => { setStayVisible(true); onSend?.(); };

  return (
    <>
      {/* Panel kendi başlığını çizer: seviye barı, sekmeler ve alt çubuk hediye kutusunun içinde. */}
      <VoiceSheet
        open={open && view === 'gifts'}
        onClose={onClose}
        title="Hediye Tahtası"
        halfHeight
        hideTitle
        panelClass="bg-[#231a31]/95 backdrop-blur-xl"
      >
        <GiftBoardContent
          {...props}
          coins={coins}
          multiplier={multiplier}
          onMultiplier={onMultiplier}
          onClose={onClose}
          onOpenCoins={() => setView('coins')}
          onSend={handleSend}
          sendDisabled={sendDisabled}
        />
      </VoiceSheet>
      {/* Gönder düğmesi kutu kapandıktan sonra köşede durur: seçili hediye aynı kişilere
          arka arkaya gönderilebilir, adet seçeneği (x1 / x2) üstünde görünür. */}
      {/* Kutu açıkken gönderim alt çubuktaki "Gönder" düğmesinden yapılır; köşedeki düğme
          yalnızca kutu kapandıktan sonra görünür ve çubuğun üstüne binmez. */}
      <GiftSendButton
        visible={!open && stayVisible}
        disabled={sendDisabled}
        onSend={handleSend}
        multiplier={multiplier}
        onMultiplier={onMultiplier}
        showMultipliers={stayVisible}
      />
      <CoinPurchasePanel open={open && view === 'coins'} coins={coins} onBack={() => setView('gifts')} />
    </>
  );
}