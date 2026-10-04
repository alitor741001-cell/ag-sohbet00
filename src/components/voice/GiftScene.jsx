import { formatK, tierForK, toneColor } from '@/lib/giftTone';
import { giftScene } from '@/lib/giftScene';
import VoiceSeatScore from '@/components/voice/VoiceSeatScore';
import SceneRocket from '@/components/voice/scenes/SceneRocket';
import SceneBoat from '@/components/voice/scenes/SceneBoat';
import ScenePlane from '@/components/voice/scenes/ScenePlane';
import SceneBalloon from '@/components/voice/scenes/SceneBalloon';
import SceneCar from '@/components/voice/scenes/SceneCar';
import SceneFireworks from '@/components/voice/scenes/SceneFireworks';
import '@/styles/giftScenes.css';

const SCENES = {
  rocket: SceneRocket,
  boat: SceneBoat,
  plane: ScenePlane,
  balloon: SceneBalloon,
  car: SceneCar,
  fireworks: SceneFireworks,
};

/**
 * Hediye gönderildiğinde odadaki herkes için hediye başına özel bir sahne oynar:
 * roket uçar, gemi suda yüzer, uçak süzülür, balon yükselir, araba geçer ya da havai fişek patlar.
 * Hediye görseli aracın içinde/üstünde durur; altta hediye adı ve gönderen → alan bilgisi yazar.
 */
export default function GiftScene({ alert, tiers = [] }) {
  if (!alert) return null;

  const Scene = SCENES[giftScene({ id: alert.giftId, name: alert.giftName, emoji: alert.emoji })] || SceneRocket;
  const color = toneColor(tierForK(tiers, alert.kValue || 0));
  const repeat = Number(alert.repeat) || 1;
  const people = Number(alert.count) || 1;
  const bulk = people > 1;
  const meta = bulk
    ? `${people} kişiye${alert.totalK ? ` • ${formatK(alert.totalK)}` : ''}`
    : `${alert.senderName ? `${alert.senderName} → ` : ''}${alert.recipientName || 'Oda'}${alert.kValue ? ` • +${formatK(alert.kValue)}` : ''}`;

  return (
    <div className="gift-scene-stage pointer-events-none absolute inset-0 z-[200] overflow-hidden" style={{ '--scene-tone': color }}>
      <Scene gift={{ imageUrl: alert.imageUrl, emoji: alert.emoji, name: alert.giftName }} />

      <div className="gift-scene-caption">
        <div
          className="flex items-center gap-2 rounded-2xl border bg-black/70 px-3 py-1.5 backdrop-blur-md"
          style={{ borderColor: color, boxShadow: `0 0 20px ${color}88` }}
        >
          <p className="text-sm font-black" style={{ color }}>{alert.giftName || 'Hediye'}</p>
          {repeat > 1 && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[11px] font-black text-white">×{repeat}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <p className="max-w-[80vw] truncate rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white/85">{meta}</p>
          {!bulk && alert.value ? <VoiceSeatScore value={alert.value} /> : null}
        </div>
      </div>
    </div>
  );
}