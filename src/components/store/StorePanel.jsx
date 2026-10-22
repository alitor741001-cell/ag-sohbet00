import BagCabinet from '@/components/store/BagCabinet';
export default function StorePanel({ open, onClose, onCoins }) {
  return open ? <BagCabinet initialTab="shop" onClose={onClose} onCoins={onCoins} /> : null;
}