import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CHATS_BG } from '@/components/layout/ThemeShell';
import ChatImageTabs from '@/components/friends/ChatImageTabs';
import InboxRows from '@/components/friends/InboxRows';

const TARGET_SEAT = 6; // 7 numaralı koltuk (indeks 0'dan başlar)

/** Panelin üst kenarını 7 numaralı koltuğun alt hizasına getirir; koltuk yoksa
    (film odası gibi) ekran yüksekliği korunur. */
function measureHeight() {
  const viewport = window.innerHeight;
  const seats = document.querySelectorAll('[data-seat-index]');
  const seat = document.querySelector(`[data-seat-index="${TARGET_SEAT}"]`) || seats[seats.length - 1];
  const rect = seat?.getBoundingClientRect();
  if (!rect || rect.bottom <= 0 || rect.bottom >= viewport) return viewport;
  return Math.min(Math.max(viewport - rect.bottom, 260), viewport * 0.85);
}

/** Oda içindeki özel mesaj listesi: ana sayfadaki özel sohbetle aynı tema görseli ve
    sekmeler, 7 numaralı koltuğa kadar açılan panelde. */
export default function RoomChatThemeList({ counts, onTab, onClose, children }) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const update = () => setHeight(measureHeight());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return createPortal(
    <>
      {onClose && <button type="button" aria-label="Kapat" onClick={onClose} className="fixed inset-0 z-[269] bg-black/60" />}
      <div className="dark fixed inset-x-0 bottom-0 z-[270] flex flex-col overflow-hidden rounded-t-[26px] bg-[#081226] text-white ring-1 ring-white/15" style={{ height: height || '45vh' }}>
        {/* Tasarım görselinin sekme şeridi: ev ekranındaki görünümün aynısı, panelin üstünde. */}
        <div className="relative w-full shrink-0 overflow-hidden" style={{ height: '29.3vw' }}>
          <img src={CHATS_BG} alt="" draggable={false} className="w-full select-none" />
          <ChatImageTabs counts={counts} band />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <InboxRows counts={counts} onSelect={onTab} />
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}