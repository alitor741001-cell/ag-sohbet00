import '@/components/voice/pk/pkTheme.css';

const AG_LOGO = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/6c080113e_logo.png';

/**
 * PK arka teması: mavi-kırmızı ikiye bölünmüş zemin, ortada AG logosu ve PK yazısı.
 * Kart içinde ebeveyn `relative isolate` olmalı; `full` ile oda zemininin tamamını kaplar.
 */
export default function PkThemeBackdrop({ full = false }) {
  return (
    <div aria-hidden="true" className={`pk-theme pointer-events-none absolute inset-0 overflow-hidden ${full ? 'pk-theme-full' : '-z-10 rounded-2xl'}`}>
      <span className="pk-theme-split" />
      <span className="pk-theme-ag">
        <img src={AG_LOGO} alt="" className="h-full w-full object-contain" />
      </span>
      <span className="pk-theme-word pk-theme-word-left">P</span>
      <span className="pk-theme-word pk-theme-word-right">K</span>
    </div>
  );
}