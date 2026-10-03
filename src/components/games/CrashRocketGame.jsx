import React, { useEffect, useRef, useState } from 'react';
import { Image } from '@/components/ui/image';
import { useSize } from '@/hooks/use-size';
import { ROCKET_SCREEN } from './rocketAssets';
import { ART_WIDTH, ART_HEIGHT, ROCKET_LAYOUT, artworkPatchStyle } from './rocket/rocketLayout';
import { flightProgress } from './rocket/rocketConfig';
import useRocketGame from './rocket/useRocketGame';
import RocketSky from './rocket/RocketSky';
import RocketFlightFx from './rocket/RocketFlightFx';
import RocketCrashFx from './rocket/RocketCrashFx';
import RocketReadout from './rocket/RocketReadout';
import RocketRecent from './rocket/RocketRecent';
import RocketPlayers from './rocket/RocketPlayers';
import RocketControls from './rocket/RocketControls';
import '@/styles/rocket.css';

/**
 * Crash Rocket: oyun ekranı görseli birebir kullanılır. Butonlar görselin kendi
 * butonlarıdır (üzerlerine dokunma alanı oturur), roket uçuş boyunca gerçekçi
 * şekilde sağ-yukarı süzülür, çakılmada patlar.
 */
export default function CrashRocketGame({ onExit, onBack }) {
  const game = useRocketGame();
  const frameRef = useRef(null);
  const size = useSize(frameRef);
  const [crashShake, setCrashShake] = useState(0);

  const cw = size?.width || 0;
  const ch = size?.height || 0;
  const scale = Math.min(cw / ART_WIDTH, ch / ART_HEIGHT) || 0;
  const imgW = ART_WIDTH * scale;
  const imgH = ART_HEIGHT * scale;
  const left = (cw - imgW) / 2;
  const top = (ch - imgH) / 2;

  const phase = game.round?.status;
  const roundNo = game.round?.round_no;
  // Çarpan arttıkça mekik ilerler, çakılınca olduğu yerde kalır, yeni turda başa döner.
  const flightMult = phase === 'crashed' ? game.round?.crash_at || 1 : phase === 'running' ? game.liveMult : 1;
  const progress = flightProgress(flightMult);

  // Çakılma anında kısa ve sert sarsıntı.
  useEffect(() => {
    if (phase !== 'crashed') {
      setCrashShake(0);
      return undefined;
    }
    setCrashShake(6);
    const timer = window.setTimeout(() => setCrashShake(0), 700);
    return () => window.clearTimeout(timer);
  }, [phase, roundNo]);

  const shake = crashShake > 0 ? crashShake : phase === 'running' ? 0.6 + progress * 1.7 : 0;

  return (
    <div ref={frameRef} className="relative h-full min-h-0 w-full overflow-hidden bg-slot">
      {imgW > 0 && (
        <div className="absolute" style={{ left, top, width: imgW, height: imgH }}>
          <div
            className={`absolute inset-0 ${shake > 0 ? 'rocket-shaking' : ''}`}
            style={shake > 0 ? { '--shake': `${shake.toFixed(2)}px` } : undefined}
          >
            <Image
              src={ROCKET_SCREEN}
              alt="Crash Rocket oyun ekranı"
              className="absolute inset-0 h-full w-full"
              fittingType="fill"
              originWidth={ART_WIDTH}
              originHeight={ART_HEIGHT}
              quality={92}
            />

            {/* Roket ve çevresindeki uzay: uçuş boyunca sağ-yukarı süzülür. */}
            <RocketSky progress={progress} />

            {/* Hız çizgileri ve motor parlaması */}
            <RocketFlightFx phase={phase} progress={progress} />

            <RocketPlayers bets={game.bets} me={game.me} />
            <RocketReadout coins={game.coins} liveMult={game.liveMult} round={game.round} />
            <RocketRecent history={game.history} />
            <RocketControls game={game} />

            {/* Çakılma: parlama, duman ve parçalar */}
            <RocketCrashFx phase={phase} roundNo={roundNo} />

            {/* Görselin sabit ses simgesi: hareketli katmanın altında kalkmaması için yama. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute"
              style={artworkPatchStyle(ROCKET_LAYOUT.mutePatch)}
            />
          </div>

          {/* Görselin kendi üst butonları: yeni buton çizilmez. */}
          <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="absolute z-20" style={ROCKET_LAYOUT.menu} />
          <button type="button" onClick={onExit} aria-label="Oyunu kapat" className="absolute z-20" style={ROCKET_LAYOUT.settings} />
        </div>
      )}

      {game.message && (
        <p className="absolute left-1/2 top-[13%] z-30 w-max max-w-[92%] -translate-x-1/2 rounded-full bg-black/80 px-3 py-1.5 text-center text-[11px] font-bold text-amber-200">
          {game.message}
        </p>
      )}
    </div>
  );
}