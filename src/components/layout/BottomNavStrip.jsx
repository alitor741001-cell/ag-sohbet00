import SupportLabel from '@/components/layout/SupportLabel';

export const NAV_BG = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/1ac262e7e_IMG_0216.jpg';

/** Alt menü şeridi her sayfada aynı görselden çizilir; "Canlı Destek" yazısı butonun içinde sabit durur. */
export default function BottomNavStrip() {
  return (
    <>
      <img src={NAV_BG} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill" style={{ clipPath: 'inset(85% 0 0 0)' }} />
      <SupportLabel top="92.5%" height="3.5%" />
    </>
  );
}