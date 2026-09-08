import LevelSpriteBadge from '@/components/levels/LevelSpriteBadge';

export const getRoomLevelTier = (value) => {
  const level = Math.min(1000, Math.max(1, Math.floor(Number(value) || 1)));
  return level <= 10 ? 'basic' : level <= 50 ? 'blue' : level <= 100 ? 'violet' : level <= 250 ? 'pink' : level <= 500 ? 'gold' : level <= 750 ? 'red' : level <= 999 ? 'premium' : 'max';
};

export default function RoomLevelBadge({ level, profile = false }) {
  if (level === undefined) return <span className="inline-flex h-10 w-20 shrink-0 animate-pulse rounded-full bg-muted" aria-label="Seviye yükleniyor" />;
  return <LevelSpriteBadge level={level} profile={profile} />;
}