import DesignBottomNav from '@/components/layout/DesignBottomNav';
import { ART } from '@/lib/designArt';

/** Tam ekran sayfa teması: sayfa zeminine tasarım görseli, altına ana menü şeridi yerleşir.
    Özel mesajlarda zemin görseli yoktur; başlık ve sekmeler kendi tasarımından gelir. */
export default function ThemeShell({ chats = false }) {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#02030c]" aria-hidden="true">
        {!chats && <img src={ART.pageBg} alt="" draggable={false} className="h-full w-full select-none object-cover" />}
      </div>
      <DesignBottomNav />
    </>
  );
}