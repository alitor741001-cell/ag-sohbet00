import DesignBottomNav from '@/components/layout/DesignBottomNav';
import NeonBackdrop from '@/components/layout/NeonBackdrop';

/** Sayfa zemini: görsel indirmeyen neon ışıklar + alt menü.
    Görsel tema kaldırıldı: sayfalar hızlı açılır, kaydırma akıcı kalır. */
export default function ThemeShell() {
  return (
    <>
      <NeonBackdrop />
      <DesignBottomNav />
    </>
  );
}