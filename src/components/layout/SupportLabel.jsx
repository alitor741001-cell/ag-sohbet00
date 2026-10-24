/** Tasarımdaki "Arkadaşlar" yazısının üstünü "Canlı Destek" ile kapatır. */
export default function SupportLabel({ top, height }) {
  return (
    <span
      className="pointer-events-none absolute flex items-center justify-center whitespace-nowrap text-[2.3vw] font-medium text-white sm:text-[12px]"
      style={{ left: '61%', width: '16.5%', top, height, background: '#100c12', boxShadow: '0 0 6px 3px #100c12', textShadow: '0 0 4px rgba(255,80,160,0.8)' }}
    >
      Canlı Destek
    </span>
  );
}