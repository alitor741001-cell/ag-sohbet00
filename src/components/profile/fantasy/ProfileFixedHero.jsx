import { useEffect, useRef, useState } from 'react';
import ProfileHeroCard from '@/components/profile/fantasy/ProfileHeroCard';

// Tema arka planıyla birebir aynı görsel: sabit başlık arkasında içerik kayarken
// görüntü değişmez, başlık hiçbir yöne kaymaz.
const THEME_BG = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/1ac262e7e_IMG_0216.jpg';

/** Profil başlığı ekranın üstünde sabit kalır; altındaki içerik yukarı doğru altından geçer. */
export default function ProfileFixedHero(props) {
  const boxRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return undefined;
    const sync = () => setHeight(node.offsetHeight);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={boxRef} className="fixed inset-x-0 top-0 z-30 overflow-hidden lg:top-16">
        <img
          src={THEME_BG}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute left-0 top-0 h-screen w-full select-none object-fill lg:-top-16"
        />
        <div
          className="relative mx-auto w-full max-w-2xl md:max-w-3xl xl:max-w-4xl"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <ProfileHeroCard {...props} />
        </div>
      </div>
      <div style={{ height }} aria-hidden="true" />
    </>
  );
}