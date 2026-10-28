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
      <div ref={boxRef} className="fixed inset-x-0 z-30 overflow-hidden" style={{ top: 'var(--safe-top)' }}>
        <div className="relative mx-auto w-full max-w-[560px]">
          <ProfileHeroCard {...props} />
        </div>
      </div>
      <div style={{ height }} aria-hidden="true" />
    </>
  );
}