/** Tasarımdaki "Arkadaşlar" yazısının üstünü "Canlı Destek" ile kapatır. */
export default function SupportLabel({ top, height }) {
  return (
    <span
      className="pointer-events-none absolute flex items-center justify-center whitespace-nowrap text-[2.4vw] font-semibold text-white sm:text-[13px]"
      style={{ left: '60%', width: '18.5%', top, height, background: '#0d0b0b' }}
    >
      Canlı Destek
    </span>
  );
}