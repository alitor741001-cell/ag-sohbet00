import { useEffect, useRef, useState } from 'react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import GiftBoardContent from '@/components/voice/GiftBoardContent';
import GiftSendButton from '@/components/voice/GiftSendButton';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';

/** Hediye Tahtası: hediye seçimi (alt panel) ve tam ekran "Coins Yükle" mağazası. */
export default function GiftBoard({ open, onClose, coins, onSend, sendDisabled, multiplier = 1, onMultiplier, ...props }) {
  const [view, setView] = useState('gifts');
  // Gönderimden sonra düğme kısa süre ekranda kalır: kutu kapanır ama aynı hediye arka arkaya
  // gönderilebilir. 5 saniye boyunca hediye atılmazsa düğme kendiliğinden kaybolur, kutu
  // yeniden açıldığında kalıcılık sıfırlanır.
  const [stayVisible, setStayVisible] = useState(false);
  // Gönderilen hediye sayısı: kutu kapandıktan sonra düğmenin üstünde X1, X2… olarak ilerler.
  const [sendTick, setSendTick] = useState(0);
  const hideTimerRef = useRef(null);

  useEffect(() => { if (open) { setView('gifts'); setStayVisible(false); setSendTick(0); } }, [open]);

  // Gönderim kabul edilmediyse (bakiye yetersiz) sayaç artmaz ve düğme ekranda kalmaz.
  const handleSend = () => {
    if (onSend?.() === false) return;
    setStayVisible(true);
    setSendTick((value) => value + 1);
  };

  // Hediye atılmadığı sürece düğme ekranda kalır; her gönderim süreyi baştan başlatır.
  useEffect(() => {
    window.clearTimeout(hideTimerRef.current);
    if (open || !stayVisible) return undefined;
    hideTimerRef.current = window.setTimeout(() => { setStayVisible(false); setSendTick(0); }, 5000);
    return () => window.clearTimeout(hideTimerRef.current);
  }, [open, stayVisible, sendTick]);

  return (
    <>
      {/* Panel kendi başlığını çizer: seviye barı, sekmeler ve alt çubuk hediye kutusunun içinde. */}
      <VoiceSheet
        open={open && view === 'gifts'}
        onClose={onClose}
        title="Hediye Tahtası"
        tall
        hideTitle
        panelClass="bg-[#231a31]/95 backdrop-blur-xl"
      >
        <GiftBoardContent
          {...props}
          coins={coins}
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
        count={sendTick}
        onSend={handleSend}
        multiplier={multiplier}
        onMultiplier={onMultiplier}
        showMultipliers={stayVisible}
      />
      <CoinPurchasePanel open={open && view === 'coins'} coins={coins} onBack={() => setView('gifts')} />
    </>
  );
}