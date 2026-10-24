import { DESIGN_IMAGE } from '@/components/layout/DesignBottomNav';

/** Tasarım görseli alt menüyle aynı hizada (alttan) durur; menü ile arka plan tek parça görünür. */
export default function DesignBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: '#0a0a0d' }} aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 top-0 mx-auto w-full max-w-[540px]">
        <img src={DESIGN_IMAGE} alt="" draggable={false} className="absolute bottom-0 left-0 w-full select-none" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, transparent calc(min(100vw, 540px) * 144 / 540 + env(safe-area-inset-bottom)), rgba(10,10,13,0.55) calc(min(100vw, 540px) * 144 / 540 + env(safe-area-inset-bottom) + 80px), rgba(10,10,13,0.55))' }}
        />
      </div>
    </div>
  );
}