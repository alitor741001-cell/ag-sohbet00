import { Image } from '@/components/ui/image';
import '@/components/auth/blueAuth.css';

const ART = {
  login: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/d78a439e4_IMG_0296.jpg',
  register: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a8675dbf0_IMG_0298.jpg',
};

export default function BlueAuthLayout({ mode = 'login', title, subtitle, children }) {
  const src = ART[mode];
  return (
    <main className={`blue-auth blue-auth-${mode}`}>
      <div className="blue-auth-stage">
        <div className="blue-auth-sides" aria-hidden="true">
          <Image src={src} alt="" className="absolute inset-0 h-full w-full" fittingType="fill" />
        </div>
        <div className="blue-auth-logo">
          <Image src={src} alt="AG, mavi alevli taç logosu" className="absolute left-0 top-0 w-full aspect-[682/1024]" fittingType="fit" loading="eager" />
        </div>
        <section className="blue-auth-content">
          <header className="blue-auth-heading"><h1>{title}</h1><p>{subtitle}</p></header>
          {children}
        </section>
        <div className="blue-auth-footer" aria-label="Sesli Sohbet">
          <Image src={src} alt="Sesli Sohbet, hızlı ve güvenli, her cihazda" className="absolute bottom-0 left-0 w-full aspect-[682/1024]" fittingType="fit" />
        </div>
      </div>
    </main>
  );
}