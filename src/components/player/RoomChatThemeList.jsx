import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import { CHATS_BG } from '@/components/layout/ThemeShell';
import ChatImageTabs from '@/components/friends/ChatImageTabs';

/** Oda içindeki özel mesaj listesi: ana sayfadaki özel sohbetle aynı tema görseli ve sekmeler, tam ekran. */
export default function RoomChatThemeList({ counts, onTab, onClose, children }) {
  return createPortal(
    <div className="dark fixed inset-0 z-[270] overflow-hidden overscroll-none bg-black text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <img src={CHATS_BG} alt="" draggable={false} className="h-full w-full scale-110 object-fill opacity-60 blur-2xl" />
      </div>
      <div className="design-screen">
        <div className="design-stage flex flex-col">
          <img src={CHATS_BG} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill" />
          <button type="button" onClick={onClose} aria-label="Geri" className="absolute left-[3%] top-[1.5%] z-50 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <ChatImageTabs counts={counts} onSelect={(key) => key !== 'chats' && onTab(key)} />
          <div className="shrink-0" style={{ height: '17.5%' }} aria-hidden="true" />
          <div className="relative mx-[5%] flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </div>
          <div className="shrink-0" style={{ height: '13.5%' }} aria-hidden="true" />
        </div>
      </div>
    </div>,
    document.body,
  );
}