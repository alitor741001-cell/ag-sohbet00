import { ChevronRight } from 'lucide-react';
import CosmeticArtwork from '@/components/store/CosmeticArtwork';
const SOURCE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/07e59aa53_IMG_0094.jpg';
const ICONS = {
  coins: { image_url: SOURCE, crop: { x: .065, y: .22, w: .095, h: .50 }, remove_white: true },
  diamonds: { image_url: SOURCE, crop: { x: .535, y: .28, w: .095, h: .48 }, remove_white: true },
};
export default function ProfileBalanceCards({ coins, diamonds, onCoins, onDiamonds }) {
  return <section aria-label="Coins ve elmas bakiyeleri" className="grid grid-cols-2 gap-2.5">{[
    { key: 'coins', label: 'Coins', value: coins, action: onCoins },
    { key: 'diamonds', label: 'Elmaslar', value: diamonds, action: onDiamonds },
  ].map(item => <button key={item.key} type="button" onClick={item.action} aria-label={`${item.label}: ${item.value == null ? '—' : item.value.toLocaleString('tr-TR')}`} className="flex min-h-24 min-w-0 items-center gap-2 rounded-2xl border border-cabinet-light/30 bg-gradient-to-br from-cabinet-surface/60 to-cabinet px-2.5 py-4 text-left text-cabinet-ink shadow-md active:scale-[.98] sm:gap-3 sm:px-4">
    <CosmeticArtwork product={ICONS[item.key]} blend={false} className="h-10 w-10 shrink-0 drop-shadow-[0_0_8px_rgba(255,215,0,0.65)] sm:h-12 sm:w-12" />
    <span className="min-w-0 flex-1"><span className="block break-all text-lg font-black leading-tight tabular-nums sm:text-2xl">{item.value == null ? '—' : item.value.toLocaleString('tr-TR')}</span><span className="mt-1 block text-xs font-semibold text-cabinet-ink/60 sm:text-sm">{item.label}</span></span>
    <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-cabinet-ink/45" />
  </button>)}</section>;
}