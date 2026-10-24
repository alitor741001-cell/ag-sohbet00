const BACKDROP = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/bb6ae2dd8_IMG_0213.jpg';

/** Özel sohbet, canlı destek, profil ve arama sayfalarının alevli arka planı. */
export default function DesignBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: '#000' }} aria-hidden="true">
      <img src={BACKDROP} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none object-cover" />
    </div>
  );
}