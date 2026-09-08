import { Image } from '@/components/ui/image';
import { getLevelBadgeFrame } from '@/lib/levelBadgeSprite';

export default function LevelSpriteBadge({ level, profile = false }) {
  const frame = getLevelBadgeFrame(level);
  const height = profile ? 72 : 44;
  const width = Math.round((frame.width / frame.height) * height);

  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width, height }}
      role="img"
      aria-label={frame.level === 1000 ? 'Maksimum seviye' : `Seviye ${frame.level}`}
    >
      <Image
        src={frame.src}
        alt=""
        aria-hidden="true"
        loading="eager"
        fittingType="fit"
        className="pointer-events-none h-full w-full object-contain"
      />
    </span>
  );
}