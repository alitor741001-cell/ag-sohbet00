import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Image } from '@/components/ui/image';
import useRocketPng from '@/components/voice/roomRocket/useRocketPng';
import { playRocketLaunchSound } from '@/lib/rocketSound';
import RocketLaunchBurst from '@/components/voice/roomRocket/RocketLaunchBurst';
import RocketEngineFlame from '@/components/voice/roomRocket/RocketEngineFlame';
import RocketGroundFlames from '@/components/voice/roomRocket/RocketGroundFlames';
import '@/components/voice/roomRocket/rocketLevelLaunch.css';

export default function RocketLaunch({ level = 1, onComplete }) {
  const src = useRocketPng(level);
  const [ready, setReady] = useState(false);
  const done = useRef(onComplete);
  done.current = onComplete;
  useEffect(() => {
    if (!ready) return;
    // Uçuş boyunca motor sesi, parlama anında patlama sesi.
    const sound = playRocketLaunchSound();
    const timer = window.setTimeout(() => done.current(), 4600);
    return () => {
      window.clearTimeout(timer);
      sound.stop();
    };
  }, [ready]);
  // Görsel yüklenmezse ya da yükleme olayı gelmezse animasyon ekranda takılı kalmaz:
  // en geç 9 saniyede kutlama kendiliğinden kapanır.
  useEffect(() => {
    const fallback = window.setTimeout(() => done.current(), 9000);
    return () => window.clearTimeout(fallback);
  }, []);
  return <div className="rocket-level-launch" data-level={level} data-ready={ready} role="img" aria-label={`LVL ${level} roketinin ateşlenme, yükseliş ve patlama animasyonu`}>
    {!ready && <Loader2 className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-spin text-slot-gold" />}
    {src && <div className="rocket-level-vehicle" aria-hidden="true">
      <RocketEngineFlame />
      <Image src={src} alt="" fittingType="fit" loading="eager" className="rocket-level-original" onLoad={() => setReady(true)} onError={() => setReady(true)} />
    </div>}
    <RocketLaunchBurst />
    <RocketGroundFlames />
  </div>;
}