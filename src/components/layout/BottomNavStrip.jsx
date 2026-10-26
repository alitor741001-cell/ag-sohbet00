import SupportLabel from '@/components/layout/SupportLabel';

export const NAV_BG = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/1ac262e7e_IMG_0216.jpg';

/** Alt menü şeridi her sayfada aynı görselden çizilir; "Canlı Destek" yazısı butonun içinde sabit durur. */
export default function BottomNavStrip() {
  return (
    <>
      {/* Şerit biraz daha aşağı indirilir: alt menü düğmeleri ekranın dibine yaklaşır. */}
      <img src={NAV_BG} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute inset-x-0 w-full select-none object-fill" style={{ top: '2.5%', height: '100%', clipPath: 'inset(82.5% 0 0 0)' }} />
      <SupportLabel top="95%" height="3.5%" />
    </>
  );
}