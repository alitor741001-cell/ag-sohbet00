import { HIDDEN_DISPLAY_NAME } from '@/lib/hiddenUser';

/**
 * Gizli kullanıcı anonsu (koltuk ızgarasının altında, son sıranın bulunduğu yerde):
 * yazı sağdan girer, sola doğru akar; tur bitince 3 saniye bekleyip yeniden kayar.
 * Kimseye ait isim, kimlik ya da profil gösterilmez — yalnızca anons görünür.
 */
export default function HiddenUserMarquee({ active }) {
  if (!active) return null;
  return (
    <div className="relative mt-4 h-6 overflow-hidden rounded-xl border border-white/15 bg-white/5" aria-live="polite">
      <span className="hidden-user-marquee">{HIDDEN_DISPLAY_NAME} girdi</span>
    </div>
  );
}