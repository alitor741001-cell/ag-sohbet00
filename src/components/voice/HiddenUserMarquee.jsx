import { useEffect, useState } from 'react';
import { HIDDEN_AVATAR_URL } from '@/lib/hiddenUser';

/** Anonsun ekranda kaldığı süre: sağdan giriş + ortada 3 saniye durma + sola çıkış. */
const LIFE_MS = 9500;

/**
 * Gizli kullanıcı anonsu (koltuk ızgarasının altında): maskeli profil ve kırmızı takma ad
 * sağdan girer, ortada 3 saniye durur, sonra sola kayıp kaybolur. Yalnızca bir kez oynar.
 * Gerçek isim, fotoğraf ya da kimlik gösterilmez.
 */
export default function HiddenUserMarquee({ active, name }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(false);
    if (!active) return;
    const timer = setTimeout(() => setDone(true), LIFE_MS);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active || done || !name) return null;

  return (
    <div className="relative mt-4 h-6 overflow-hidden rounded-xl border border-white/15 bg-white/5" aria-live="polite">
      <span className="hidden-user-marquee">
        <img
          src={HIDDEN_AVATAR_URL}
          alt=""
          referrerPolicy="no-referrer"
          draggable={false}
          className="h-5 w-5 shrink-0 rounded-full border border-amber-300/70 object-cover"
        />
        <span className="hidden-user-name">{name} girdi</span>
      </span>
    </div>
  );
}