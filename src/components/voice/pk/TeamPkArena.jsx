import TeamPkSide from '@/components/voice/pk/TeamPkSide';
import '@/components/voice/pk/teamPkArena.css';

/** Sunucu üstte, kırmızı ve mavi takımlar ikiye iki kart düzeninde. */
export default function TeamPkArena({ seats, renderSeat, onSelectSeat, footer, width = 360 }) {
  const cellWidth = (width - 36) / 4;
  const size = cellWidth >= 88 ? 'lg' : cellWidth >= 68 ? 'md' : cellWidth >= 52 ? 'sm' : 'xs';
  const space = { xs: 42, sm: 52, md: 68, lg: 88 }[size];
  return (
    <div className="team-pk-arena relative isolate w-full">
      <div className="team-pk-host">{renderSeat(0, size === 'xs' ? 'sm' : size, width / 2)}</div>
      <div className="team-pk-teams">
        <TeamPkSide tone="red" indices={[1, 2, 5, 6]} seats={seats} renderSeat={renderSeat} onSelectSeat={onSelectSeat} size={size} space={space} />
        <TeamPkSide tone="blue" indices={[3, 4, 7, 8]} seats={seats} renderSeat={renderSeat} onSelectSeat={onSelectSeat} size={size} space={space} />
      </div>
      {footer}
    </div>
  );
}