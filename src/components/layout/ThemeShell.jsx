import DesignBottomNav from '@/components/layout/DesignBottomNav';
import { ART } from '@/lib/designArt';

export const CHATS_BG = ART.chatsBg;

/** Tam ekran sayfa teması: sayfa zeminine tasarım görseli, altına ana menü şeridi yerleşir. */
export default function ThemeShell({ chats = false }) {
  const bg = chats ? ART.chatsBg : ART.pageBg;
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black" aria-hidden="true">
        <img src={bg} alt="" draggable={false} className="h-full w-full select-none object-cover" />
      </div>
      <DesignBottomNav />
    </>
  );
}