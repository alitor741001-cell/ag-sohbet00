// Çentikli cihazlarda üstte kalan şerit (durum çubuğu / çentik) bu temayla kaplanır.
// Sabit durur: sayfa içeriği yukarı kaydığında bu şeridin altından geçer.
const NOTCH_THEME = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/84313686a_IMG_0213.jpg';

export default function NotchThemeStrip() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[70]"
      style={{
        height: 'var(--safe-top)',
        backgroundColor: '#000',
        backgroundImage: `url(${NOTCH_THEME})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}