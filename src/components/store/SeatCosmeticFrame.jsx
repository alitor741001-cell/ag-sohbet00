import CosmeticArtwork from '@/components/store/CosmeticArtwork';
export default function SeatCosmeticFrame({ seat, choice }) {
  if (!seat?.user_id || choice?.owner_id !== seat.user_id || !choice.seat_product_id || !choice.seat_image_url) return null;
  return <span aria-hidden="true" className="pointer-events-none absolute -inset-[22%] z-10">
    <CosmeticArtwork product={{ name: '', image_url: choice.seat_image_url, crop: choice.seat_crop, remove_white: choice.seat_remove_white }} className="h-full w-full object-contain" draggable={false} />
  </span>;
}