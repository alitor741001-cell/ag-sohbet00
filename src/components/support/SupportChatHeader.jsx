import { useState } from 'react';
import { ArrowLeft, Headset, MoreHorizontal } from 'lucide-react';
export default function SupportChatHeader({ onBack, onEnd, closing, onSearch }) {
  const [menu, setMenu] = useState(false);
  return <header className="support-chat-header">
    <button type="button" onClick={onBack} aria-label="Geri" className="shrink-0 p-1"><ArrowLeft className="h-6 w-6" /></button>
    <span className="support-chat-logo"><Headset className="h-7 w-7" /></span>
    <div className="min-w-0 flex-1"><h1 className="text-lg font-bold">Canlı Destek</h1><p className="support-chat-online text-xs">● Çevrimiçi — hemen yazabilirsiniz</p></div>
    <div className="relative shrink-0"><button type="button" onClick={() => setMenu(!menu)} aria-label="Görüşme seçenekleri" aria-expanded={menu} className="p-2"><MoreHorizontal className="h-6 w-6" /></button>
      {menu && <div className="support-chat-menu"><button type="button" onClick={onBack}>Geri</button>{onEnd && <button type="button" disabled={closing} onClick={() => { setMenu(false); onEnd(); }}>{closing ? 'Sonlandırılıyor...' : 'Görüşmeyi sonlandır'}</button>}{onSearch && <button type="button" onClick={() => { setMenu(false); onSearch(); }}>ID ile ara</button>}</div>}
    </div>
  </header>;
}