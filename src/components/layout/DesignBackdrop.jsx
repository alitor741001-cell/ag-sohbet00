import { DESIGN_IMAGE } from '@/components/layout/DesignBottomNav';

/** Tasarımın sadece alevli kenar dokusu arka plan olur; ana sayfa içeriği görünmez. */
export default function DesignBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: '#0a0a0d' }} aria-hidden="true">
      <div className="absolute inset-x-0 top-0 mx-auto h-full w-full max-w-[540px] overflow-hidden">
        <img
          src={DESIGN_IMAGE}
          alt=""
          draggable={false}
          className="absolute left-0 w-full select-none"
          style={{ top: '-120%', height: '256%' }}
        />
      </div>
    </div>
  );
}