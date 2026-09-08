import { Image } from '@/components/ui/image';
import { LEVEL_BADGE_SPRITE, getLevelBadgeFrame } from '@/lib/levelBadgeSprite';

export default function LevelSpriteBadge({ level, profile = false }) {
  const frame = getLevelBadgeFrame(level);
  const scale = profile ? 0.92 : 0.56;
  const width = Math.round(frame.width * scale);
  const height = Math.round(frame.height * scale);

  return (
    <span className="relative inline-block shrink-0 overflow-hidden" style={{ width, height }} role="img" aria-label={frame.level === 1000 ? 'Maksimum seviye' : `Seviye ${frame.level}`}>
      <Image
        src={LEVEL_BADGE_SPRITE}
        alt=""
        aria-hidden="true"
        loading="eager"
        className="pointer-events-none absolute"
        style={{ width: 1024 * scale, height: 341 * scale, maxWidth: 'none', left: -frame.x * scale, top: -frame.y * scale }}
      />
    </span>
  );
}