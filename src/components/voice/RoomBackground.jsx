import { backgroundCss, backgroundOf } from '@/lib/roomBackgrounds';

/** Sesli odanın zemini: seçilen arka plan ve varsa oda kapak görseli. */
export default function RoomBackground({ value, cover }) {
  const tone = backgroundOf(value);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: backgroundCss(value) }} />
      {cover ? <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${cover})` }} /> : null}
      <div
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-40"
        style={{ background: `radial-gradient(circle, ${tone?.accent || '#6fe6dc'}, transparent 70%)` }}
      />
      <div
        className="absolute -right-20 bottom-10 h-64 w-64 rounded-full blur-3xl opacity-25"
        style={{ background: `radial-gradient(circle, ${tone?.accent || '#8fd8ff'}, transparent 70%)` }}
      />
    </div>
  );
}