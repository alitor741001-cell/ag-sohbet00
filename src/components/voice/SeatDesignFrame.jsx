import DesignSprite, { seatFrameBox } from '@/components/voice/DesignSprite';

/** Tasarımdaki süslü koltuk çerçevesi: iç dairesi koltuğun ortasına oturur. */
export default function SeatDesignFrame({ index }) {
  return (
    <DesignSprite
      {...seatFrameBox(index)}
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[150%]"
      style={{ transform: 'translate(-50%, -61%)' }}
    />
  );
}