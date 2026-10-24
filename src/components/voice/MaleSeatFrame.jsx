import MaleRoomSprite from '@/components/voice/MaleRoomSprite';
export default function MaleSeatFrame({ variant = 0, children, className = '', glow }) {
  const index = Math.abs(variant) % 24, col = index % 6, row = Math.floor(index / 6);
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`} style={{ boxShadow: glow }}>
      <span className="pointer-events-none absolute" style={{ left: '-23%', top: '-54%', width: '146%' }}>
        <MaleRoomSprite x={col * 83} y={270 + row * 122} w={83} h={116}>
          <span className="male-room-seat-number">{variant + 1}</span>
        </MaleRoomSprite>
      </span>
      <span className="relative flex h-full w-full items-center justify-center rounded-full">{children}</span>
    </span>
  );
}