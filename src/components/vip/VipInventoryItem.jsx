import VipCosmeticPreview from '@/components/vip/VipCosmeticPreview';
import { vipVars } from '@/components/vip/vipTheme';
import vipFrameArt from '@/lib/vipFrameArt';
export default function VipInventoryItem({ item, label, busy, onToggle, onPreview }) {
  return <article className="vip-tile rounded-xl p-2" style={vipVars(item.theme)}>
    <button type="button" onClick={() => onPreview({ kind: item.kind, label, theme: item.theme })} aria-label={`VIP ${item.level} ${label} ön izle`} className="w-full"><VipCosmeticPreview kind={item.kind} theme={item.theme} /></button>
    <p className="vip-gold text-center text-[10px] font-bold">VIP {item.level}</p>
    {item.kind === 'frame' && <p className="mt-1 text-center text-[10px] text-cabinet-ink">{vipFrameArt(item.level, item.theme?.frame_seed, item.theme?.frame_level)?.name}</p>}
    <div className="mt-2 flex flex-col gap-1">
      <button type="button" disabled={!!busy || (!item.usable && !item.equipped)} onClick={() => onToggle(item.kind, !item.equipped, item.level)} className={`rounded-lg px-2 py-1.5 text-[10px] font-black disabled:opacity-40 ${item.active ? 'vip-glass' : 'vip-button'}`}>{item.equipped ? 'Çıkar' : item.usable ? 'Tak' : 'Üyelik gerekli'}</button>
      <button type="button" onClick={() => onPreview({ kind: item.kind, label, theme: item.theme })} className="vip-tint py-1 text-[9px]">Ön İzle</button>
    </div>
  </article>;
}