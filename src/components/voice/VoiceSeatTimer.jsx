/**
 * Koltuk altı kartındaki süre sayacı: "Devam Ediyor" yazar ve sayı 1'den başlayıp her saniye ilerler.
 * Genişlik koltuk boyutuna göre seçilir ki koltuk ızgarası kaymasın.
 */
const WIDTH = { xs: 'w-[46px]', sm: 'w-[56px]', md: 'w-[72px]', lg: 'w-[92px]' };

export default function VoiceSeatTimer({ seconds = 0, size = 'md' }) {
  const shown = Math.max(1, Math.round(Number(seconds) || 0));

  return (
    <span
      className={`mt-1 flex ${WIDTH[size] || WIDTH.md} flex-col items-center gap-0.5 rounded-lg border border-emerald-400/40 bg-emerald-950/70 px-1 py-1 shadow-[0_0_10px_rgba(16,185,129,0.25)]`}
      aria-label={`Devam ediyor, ${shown} saniye`}
    >
      <span className="text-center text-[9px] font-bold leading-[1.05] text-emerald-300">Devam Ediyor</span>
      <span key={shown} className="number-pop text-[12px] font-black leading-none tabular-nums text-white">{shown}</span>
    </span>
  );
}