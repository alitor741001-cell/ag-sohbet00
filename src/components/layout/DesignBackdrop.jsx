import { DESIGN_IMAGE } from '@/components/layout/DesignBottomNav';

/** Tasarımın alevli kenar dokusu (orta-alt bölge) tüm sayfaların arka planı olur. */
export default function DesignBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: '#0a0a0d' }} aria-hidden="true">
      <img
        src={DESIGN_IMAGE}
        alt=""
        className="absolute left-0 w-full select-none"
        style={{ top: '-120%', height: '256%' }}
      />
    </div>
  );
}