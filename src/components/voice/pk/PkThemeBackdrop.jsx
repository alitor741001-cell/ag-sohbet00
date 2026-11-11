import '@/components/voice/pk/pkTheme.css';

/**
 * PK arka teması: mavi-kırmızı ikiye bölünmüş zemin, ortada büyük PK yazısı (P mavi, K kırmızı).
 * Kart içinde ebeveyn `relative isolate` olmalı; `full` ile oda zemininin tamamını kaplar.
 */
export default function PkThemeBackdrop({ full = false }) {
  return (
    <div aria-hidden="true" className={`pk-theme pointer-events-none absolute inset-0 overflow-hidden ${full ? 'pk-theme-full' : '-z-10 rounded-2xl'}`}>
      <span className="pk-theme-split" />
      <span className="pk-theme-pk">
        <b className="pk-theme-pk-blue">P</b>
        <b className="pk-theme-pk-red">K</b>
      </span>
      <span className="pk-theme-word pk-theme-word-left">P</span>
      <span className="pk-theme-word pk-theme-word-right">K</span>
    </div>
  );
}