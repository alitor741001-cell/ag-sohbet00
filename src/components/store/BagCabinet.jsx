import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Store } from 'lucide-react';
import usePageScrollLock from '@/hooks/usePageScrollLock';
import BagOrbs from '@/components/store/BagOrbs';
import StoreCatalog from '@/components/store/StoreCatalog';
import FrameInventory from '@/components/store/FrameInventory';
import '@/components/store/cabinet.css';
export default function BagCabinet({ children, cosmetics, groups = [], onClose, initialTab = 'frames', onCoins }) {
  const [tab, setTab] = useState(initialTab); usePageScrollLock(true);
  const shopping = initialTab === 'shop';
  const tabs = shopping ? [['shop','Çerçeve Koleksiyonu'], ['frames','Çerçevelerim']] : [['frames','Çerçevelerim'], ...(children ? [['memberships','VIP Üyelikleri']] : []), ...groups.filter(group => !['frame','banner','avatar'].includes(group.kind)).map(group => [`vip-${group.kind}`, group.label])];
  return createPortal(<div role="dialog" aria-modal="true" aria-label={shopping ? 'Çerçeve Koleksiyonu' : 'Çanta'} className="cosmetic-cabinet fixed inset-0 z-[300] flex flex-col font-body">
    <header className="mx-auto flex w-full max-w-xl shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]"><button type="button" onClick={onClose} aria-label="Geri" className="flex h-11 w-11 items-center justify-center rounded-full border border-cabinet-gold/30"><ChevronLeft className="h-6 w-6" /></button><h1 className="text-xl font-black text-cabinet-ink">{shopping ? 'Çerçeve Koleksiyonu' : 'Çanta'}</h1><Store className="h-6 w-6 text-cabinet-gold" /></header>
    {!shopping && <BagOrbs groups={groups} />}
    <nav className="mx-auto flex w-full max-w-xl shrink-0 gap-2 overflow-x-auto px-3 py-4" aria-label="Çanta bölümleri">{tabs.map(([id,label]) => <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab===id ? 'page' : undefined} className={`min-h-11 shrink-0 rounded-full border px-4 text-xs font-bold ${tab===id ? 'border-cabinet-gold bg-cabinet-light/35 text-cabinet-gold' : 'border-cabinet-light/30 text-cabinet-ink'}`}>{label}</button>)}</nav>
    <div className="cabinet-shelves mx-auto min-h-0 w-full max-w-xl flex-1 overflow-y-auto overscroll-contain rounded-t-[2rem] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {tab==='memberships' && children}
      {tab==='frames' && <><FrameInventory onShop={() => setTab('shop')} />{cosmetics?.('frame')}</>}
      {tab==='shop' && <StoreCatalog onInventory={() => setTab('frames')} onCoins={onCoins} />}
      {tab.startsWith('vip-') && cosmetics?.(tab.slice(4))}
    </div>
  </div>, document.body);
}