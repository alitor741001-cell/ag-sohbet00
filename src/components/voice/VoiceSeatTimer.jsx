/**
 * Koltuk altındaki süre sayacı: "Devam Ediyor" yazar ve 1'den başlayıp her saniye ilerler.
 * Genişlik koltuk boyutuna göre seçilir ki koltuk ızgarası kaymasın.
 */
const WIDTH = { xs: 'w-[42px]', sm: 'w-[52px]', md: 'w-[68px]', lg: 'w-[88px]' };

export default function VoiceSeatTimer({ seconds = 0, size = 'md' }) {
  const shown = Math.max(1, Math.round(Number(seconds) || 0));

  return (
    <span
      className={`mt-0.5 flex ${WIDTH[size] || WIDTH.md} flex-col items-center rounded-md border border-emerald-400/30 bg-emerald-400/10 px-0.5 py-0.5`}
      aria-label={`Devam ediyor, ${shown} saniye`}
    >
      <span className="text-center text-[9px] font-semibold leading-[1.05] text-emerald-300">Devam Ediyor</span>
      <span key={shown} className="number-pop text-[11px] font-black tabular-nums text-white">{shown}</span>
    </span>
  );
}