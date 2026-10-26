import { useState } from 'react';
import { ArrowLeft, Headset } from 'lucide-react';

/** Başlık: geri oku; görüşme açıkken basınca "Geri" ve "Görüşmeyi sonlandır" seçenekleri çıkar. */
export default function SupportChatHeader({ onBack, onEnd, closing }) {
  const [menu, setMenu] = useState(false);
  const press = () => (onEnd ? setMenu(value => !value) : onBack?.());
  return <header className="support-chat-header">
    <div className="relative shrink-0">
      <button type="button" onClick={press} aria-label="Geri" aria-expanded={onEnd ? menu : undefined} className="flex items-center gap-1 p-1">
        <ArrowLeft className="h-6 w-6" /><span className="text-sm font-bold">Geri</span>
      </button>
      {menu && onEnd && <>
        <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} aria-hidden="true" />
        <div className="support-chat-menu support-chat-menu-left">
          <button type="button" onClick={() => { setMenu(false); onBack?.(); }}>Geri</button>
          <button type="button" disabled={closing} onClick={() => { setMenu(false); onEnd(); }}>{closing ? 'Sonlandırılıyor...' : 'Görüşmeyi sonlandır'}</button>
        </div>
      </>}
    </div>
    <span className="support-chat-logo"><Headset className="h-7 w-7" /></span>
    <div className="min-w-0 flex-1"><h1 className="text-lg font-bold">Canlı Destek</h1><p className="support-chat-online text-xs">● Çevrimiçi — hemen yazabilirsiniz</p></div>
  </header>;
}