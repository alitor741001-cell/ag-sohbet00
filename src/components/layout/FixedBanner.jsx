import BannerBackdrop from '@/components/layout/BannerBackdrop';

/** Ana sayfa üst şeridi gibi ekrana sabit başlık: kaymaz, oynamaz.
    Yer tutucu içeriğin başlığın altında kalmasını önler. */
export default function FixedBanner({ ratio, className = '', children, maxWidth = 'max-w-2xl' }) {
  const box = <div className={`mx-auto w-full ${maxWidth} ${className}`}><div className="relative w-full" style={{ aspectRatio: ratio }}>{children}</div></div>;
  return (
    <>
      <div aria-hidden="true" className="invisible pt-[env(safe-area-inset-top)]">
        <div className={`mx-auto w-full ${maxWidth} ${className}`}><div style={{ aspectRatio: ratio }} /></div>
      </div>
      <div className="fixed inset-x-0 top-0 z-40 isolate pt-[env(safe-area-inset-top)]" style={{ clipPath: 'inset(0)' }}>
        <BannerBackdrop />
        {box}
      </div>
    </>
  );
}