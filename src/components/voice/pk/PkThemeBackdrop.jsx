import '@/components/voice/pk/pkTheme.css';

const AG_LOGO = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/6c080113e_logo.png';

/** PK arka teması: mavi-kırmızı ikiye bölünmüş zemin, ortada AG logosu ve PK yazısı. Ebeveyn `relative isolate` olmalı. */
export default function PkThemeBackdrop() {
  return (
    <div aria-hidden="true" className="pk-theme pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
      <span className="pk-theme-split" />
      <span className="pk-theme-ag">
        <img src={AG_LOGO} alt="" className="h-full w-full object-contain" />
      </span>
      <span className="pk-theme-word pk-theme-word-left">P</span>
      <span className="pk-theme-word pk-theme-word-right">K</span>
    </div>
  );
}