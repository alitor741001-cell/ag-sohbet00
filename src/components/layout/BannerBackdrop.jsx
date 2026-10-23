import { HOME_DESIGN } from '@/components/layout/HomeImageNav';

/** Sabit banner'ın arkasında temanın birebir aynı hizadaki kopyası:
    kaydırılan içerik banner'ın altından görünmez, banner yine şeffaf görünür.
    Üst kapsayıcıdaki clip-path bu sabit katmanı banner sınırına kırpar. */
export default function BannerBackdrop() {
  return <div aria-hidden="true" className="app-design-backdrop pointer-events-none fixed inset-0 -z-10" style={{ backgroundImage: `url(${HOME_DESIGN})` }} />;
}