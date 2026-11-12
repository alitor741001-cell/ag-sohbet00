import TeamPkSide from '@/components/voice/pk/TeamPkSide';
import '@/components/voice/pk/teamPkArena.css';

/** Sunucu üstte, kırmızı ve mavi takımlar ikiye iki kart düzeninde. */
export default function TeamPkArena({ seats, renderSeat, onSelectSeat, footer, width = 360, maxHeight }) {
  const cardHeight = maxHeight > 0 ? Math.max(72, (maxHeight - 175) / 2) : undefined;
  const cellWidth = Math.min((width - 18) / 4, cardHeight ? cardHeight - 34 : Infinity);
  const size = cellWidth >= 88 ? 'lg' : cellWidth >= 68 ? 'md' : cellWidth >= 52 ? 'sm' : 'xs';
  const space = { xs: 42, sm: 52, md: 68, lg: 88 }[size];
  return (
    <div className="team-pk-arena relative isolate w-full" style={cardHeight ? { '--pk-card-height': `${cardHeight}px` } : undefined}>
      <div className="team-pk-host">{renderSeat(0, width > 600 ? 'md' : 'sm', width / 2)}</div>
      <div className="team-pk-teams">
        <TeamPkSide tone="red" indices={[1, 2, 5, 6]} seats={seats} renderSeat={renderSeat} onSelectSeat={onSelectSeat} size={size} space={space} />
        <TeamPkSide tone="blue" indices={[3, 4, 7, 8]} seats={seats} renderSeat={renderSeat} onSelectSeat={onSelectSeat} size={size} space={space} />
      </div>
      {footer}
    </div>
  );
}