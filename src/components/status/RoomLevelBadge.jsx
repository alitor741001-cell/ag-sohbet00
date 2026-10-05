/**
 * Oda LVL rozeti: oda içi seviye (1–1000).
 * Seviye yükseldiğinde odayı yenilemeden yerinde güncellenir (bkz. useRoomLevels).
 */
const TIERS = [[1000, 'max'], [750, 'red'], [500, 'gold'], [250, 'pink'], [150, 'violet'], [75, 'blue']];

export const roomLevelTier = (level) => TIERS.find(([minimum]) => Number(level) >= minimum)?.[1] || 'basic';

export default function RoomLevelBadge({ level = 0, className = '' }) {
  const value = Math.max(0, Math.floor(Number(level) || 0));
  if (!value) return null;
  return (
    <span
      data-level-tier={roomLevelTier(value)}
      className={`room-level-badge inline-flex shrink-0 items-center rounded-full border px-1.5 py-[1px] text-[9px] font-black leading-none tabular-nums ${className}`}
    >
      LVL {value}
    </span>
  );
}