import { DESIGN_IMAGE } from '@/components/layout/DesignBottomNav';

const NAV_H = 'calc(min(100vw, 540px) * 144 / 540 + env(safe-area-inset-bottom))';

/** Görsel alt menüyle birebir aynı hizada; ortadaki ana sayfa içeriği koyu örtüyle gizlenir, kenar alevleri kalır. */
export default function DesignBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: '#0a0a0d' }} aria-hidden="true">
      <div className="absolute inset-0 mx-auto w-full max-w-[540px]">
        <img src={DESIGN_IMAGE} alt="" draggable={false} className="absolute bottom-0 left-0 w-full select-none" />
        <div
          className="absolute inset-x-0 top-0"
          style={{
            bottom: NAV_H,
            background: 'linear-gradient(to right, transparent 0%, #0a0a0d 20%, #0a0a0d 80%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 90px), transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black calc(100% - 90px), transparent 100%)',
          }}
        />
      </div>
    </div>
  );
}