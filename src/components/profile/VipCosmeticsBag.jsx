import { useState } from 'react';
import VipInventoryItem from '@/components/vip/VipInventoryItem';
import VipPreviewDialog from '@/components/vip/VipPreviewDialog';
export default function VipCosmeticsBag({ groups = [], level = 0, busy, onToggle, error = '' }) {
  const [preview, setPreview] = useState(null);
  return <section className="vip-world mt-4 rounded-2xl p-3">
    <h2 className="vip-gold text-sm font-black">VIP Kozmetik Çantam</h2>
    <p className="mt-1 text-[10px] text-muted-foreground">Her kategori bağımsızdır. Farklı seviyelerin eşyalarını birlikte kullanabilirsin.</p>
    {level < 5 && <p className="mt-2 text-xs text-muted-foreground">Aktif üyelik yok. Kazanılmış kozmetikler saklanır; yenileyince yeniden kullanılabilir.</p>}
    {groups.map(({ kind, label, items: owned }) => {
      return <div key={kind} className="mt-4"><h3 className="mb-2 text-xs font-bold">{label}</h3>
        {owned.length ? <div className="grid grid-cols-3 gap-2">{owned.map((item) => <VipInventoryItem key={`${kind}-${item.level}`} item={item} label={label} busy={busy} onToggle={onToggle} onPreview={setPreview} />)}</div>
          : <p className="text-[10px] text-muted-foreground">{kind === 'avatar' ? 'Hareketli avatar yükleme altyapısı henüz bağlı değil.' : 'Bu kategoride henüz kozmetik kazanmadın.'}</p>}
      </div>;
    })}
    {error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
    <VipPreviewDialog preview={preview} onClose={() => setPreview(null)} />
  </section>;
}