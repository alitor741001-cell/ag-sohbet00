import { useEffect, useRef, useState } from 'react';
import ProfileHeroCard from '@/components/profile/fantasy/ProfileHeroCard';

/** Profil başlığı ekranın üstünde sabit kalır; altındaki içerik yukarı doğru altından geçer.
    Başlığın arkasında tema görseli yoktur: profil kartı doğrudan sayfa zemininde durur. */
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
      {/* Başlığın arkası sayfa zeminiyle boyanır: aşağıdaki içerik bu hizaya gelince
          ajans kimliği şeridinin altından geçer, arkasında görünmez. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-20 overflow-hidden bg-[#02030c]"
        style={{ height: `calc(var(--safe-top) + ${height}px)` }}
      />
      <div ref={boxRef} className="fixed inset-x-0 z-30 overflow-hidden" style={{ top: 'var(--safe-top)' }}>
        <div className="relative mx-auto w-full max-w-[560px]">
          <ProfileHeroCard {...props} />
        </div>
      </div>
      {/* İçerik, başlığın arkasındaki zemin şeridinin hemen altından başlar. */}
      <div style={{ height: `calc(var(--safe-top) + ${height}px)` }} aria-hidden="true" />
    </>
  );
}