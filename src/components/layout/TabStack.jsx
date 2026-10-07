import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TAB_PATHS } from '@/lib/tabPaths';

// Sekme sayfaları ilk açılışta indirilir; sonra bellekte kalır.
const PAGES = {
  '/': lazy(() => import('@/pages/Home')),
  '/arkadaslar': lazy(() => import('@/pages/Friends')),
  '/profil': lazy(() => import('@/pages/Profile')),
};

/**
 * Sekme yığını: ziyaret edilen sekme sökülmez, yalnızca gizlenir. Böylece liste
 * durumu, açık sohbet, yazılan taslak ve kaydırma konumu sekme değişiminde korunur.
 */
export default function TabStack({ activePath }) {
  const reduceMotion = useReducedMotion();
  // Hiç açılmamış sekme boşuna yüklenmez; açılanlar birikir.
  const [visited, setVisited] = useState(() => (activePath ? [activePath] : []));
  const scrollPositions = useRef({});

  useEffect(() => {
    if (!activePath) return;
    setVisited((prev) => (prev.includes(activePath) ? prev : [...prev, activePath]));
  }, [activePath]);

  // Kaydırma konumu görünür sekmenin adına yazılır.
  useEffect(() => {
    const onScroll = () => {
      if (activePath) scrollPositions.current[activePath] = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [activePath]);

  // Sekmeye dönüldüğünde kaldığı yerden devam edilir.
  useLayoutEffect(() => {
    if (!activePath || !TAB_PATHS.includes(activePath)) return;
    window.scrollTo(0, scrollPositions.current[activePath] || 0);
  }, [activePath]);

  return (
    <>
      {visited.map((path) => {
        const Page = PAGES[path];
        const visible = path === activePath;
        return (
          <div key={path} className={visible ? undefined : 'hidden'}>
            {/* Sekme değişimi: sökülüp yeniden kurulmaz, yumuşak görünürlük geçişi yapılır. */}
            <motion.div
              initial={false}
              animate={{ opacity: visible ? 1 : 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
            >
              <Suspense fallback={null}>
                <Page />
              </Suspense>
            </motion.div>
          </div>
        );
      })}
    </>
  );
}