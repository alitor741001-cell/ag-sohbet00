import { DESIGN_IMAGE } from '@/components/layout/DesignBottomNav';

/** Ana sayfa tasarımının aynısı; sadece üst butonlar (%12) gizlenir. */
export default function DesignBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: '#000' }} aria-hidden="true">
      <img src={DESIGN_IMAGE} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none object-fill" />
      <div className="absolute inset-x-0 top-0" style={{ height: '12%', background: 'linear-gradient(to bottom, #000 80%, transparent)' }} />
    </div>
  );
}