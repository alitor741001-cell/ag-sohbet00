export default function RoomLevelBadge({ level = 1 }) {
  const tier = level >= 750 ? 'max' : level >= 500 ? 'premium' : level >= 250 ? 'red' : level >= 150 ? 'gold' : level >= 75 ? 'pink' : level >= 50 ? 'violet' : level >= 25 ? 'blue' : 'basic';
  return (
    <span data-level-tier={tier} className="room-level-badge inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border">
      LVL {level}
    </span>
  );
}