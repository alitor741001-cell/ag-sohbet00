import { ChevronRight } from 'lucide-react';
import CosmeticArtwork from '@/components/store/CosmeticArtwork';
import NeonPanel from '@/components/profile/neon/NeonPanel';

const REFERENCE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/3aec5d6d3_IMG_0481.jpg';
const crops = {
  coins: { x: .125, y: .508, w: .12, h: .079 },
  diamonds: { x: .535, y: .51, w: .12, h: .079 },
  vip: { x: .108, y: .616, w: .13, h: .079 },
  history: { x: .533, y: .616, w: .115, h: .079 },
};
export default function DragonWalletTile({ kind, label, value, sub, onClick }) {
  return <NeonPanel className={`dragon-wallet-tile dragon-wallet-${kind}`}>
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 px-2 py-3 text-left">
      <CosmeticArtwork product={{ image_url: REFERENCE, crop: crops[kind] }} blend={false} className="dragon-wallet-art shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="dragon-wallet-label block font-bold">{label}</span>
        <span className="dragon-wallet-value block truncate font-black leading-tight tabular-nums">{value}</span>
        {sub != null && <span className="dragon-wallet-sub block truncate font-bold tabular-nums">{sub}</span>}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </button>
  </NeonPanel>;
}