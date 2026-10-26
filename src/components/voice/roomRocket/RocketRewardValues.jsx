import { BASE_PRIZES, LEVEL_VIPS } from '@/components/voice/roomRocket/rocketArtwork';

/** Identical artwork geometry for every level; only the actual rewards change. */
export default function RocketRewardValues({ level }) {
  return <div className="room-rocket-values" aria-label={`LVL ${level} ödülleri`}>
    {BASE_PRIZES.map((prize, index) => <output key={index} className="room-rocket-fixed-value" data-rank={index + 1} style={{ top: `${32.5 + index * 16.15}%` }} aria-label={`${index + 1}. sıra, ${prize * level} coin`}>{prize * level}</output>)}
    <span className="room-rocket-fixed-vip">VIP {LEVEL_VIPS[level - 1]}</span>
  </div>;
}