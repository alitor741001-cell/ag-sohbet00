import LevelSpriteBadge from '@/components/levels/LevelSpriteBadge';

export const getRoomLevelTier = (value) => {
  const level = Math.min(1000, Math.max(1, Math.floor(Number(value) || 1)));
  return level <= 10 ? 'basic' : level <= 50 ? 'blue' : level <= 100 ? 'violet' : level <= 250 ? 'pink' : level <= 500 ? 'gold' : level <= 750 ? 'red' : level <= 999 ? 'premium' : 'max';
};

export default function RoomLevelBadge({ level, profile = false, compact = false }) {
  if (level === undefined) return <span className={`inline-flex shrink-0 animate-pulse rounded-full bg-muted ${compact ? 'h-6 w-12' : 'h-10 w-20'}`} aria-label="Seviye yükleniyor" />;
  return <LevelSpriteBadge level={level} profile={profile} compact={compact} />;
}