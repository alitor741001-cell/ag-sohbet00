import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import VipInventoryItem from '@/components/vip/VipInventoryItem';
import VipPreviewDialog from '@/components/vip/VipPreviewDialog';
export default function VipCosmeticsBag({ groups = [], level = 0, busy, onToggle, error = '', category, loading = false }) {
  const [preview, setPreview] = useState(null);
  const [kindFilter, setKindFilter] = useState('frame');
  const selectedKind = category || kindFilter;
  if (loading && !groups.length) return <Loader2 aria-label="Eşyalar yükleniyor" className="mx-auto my-8 h-6 w-6 animate-spin text-cabinet-gold" />;
  return <section className="vip-world mt-4 rounded-2xl p-3">
    <h2 className="vip-gold text-sm font-black">{category ? `VIP ${groups.find(group => group.kind === selectedKind)?.label || 'Eşyalarım'}` : 'VIP Eşyalarım'}</h2>
    <p className="mt-1 text-[10px] text-muted-foreground">Her kategori bağımsızdır. Farklı seviyelerin eşyalarını birlikte kullanabilirsin.</p>
    {level < 5 && <p className="mt-2 text-xs text-muted-foreground">Aktif üyelik yok. Kazanılmış kozmetikler saklanır; yenileyince yeniden kullanılabilir.</p>}
    {!category && <nav className="my-4 flex gap-2 overflow-x-auto pb-2" aria-label="Eşya kategorileri">{groups.map(group => <button type="button" key={group.kind} onClick={() => setKindFilter(group.kind)} aria-pressed={selectedKind===group.kind} className={`min-h-11 shrink-0 rounded-full border px-4 text-xs font-bold ${selectedKind===group.kind ? 'border-cabinet-gold bg-cabinet-light/30 text-cabinet-gold' : 'border-cabinet-light/25 text-cabinet-ink'}`}>{group.label}</button>)}</nav>}
    {groups.filter(group => group.kind===selectedKind).map(({ kind, label, items: owned }) => {
      return <div key={kind} className="mt-4"><h3 className="mb-2 text-xs font-bold">{label}</h3>
        {owned.length ? <div className="grid grid-cols-3 gap-2">{owned.map((item) => <VipInventoryItem key={`${kind}-${item.level}`} item={item} label={label} busy={busy} onToggle={onToggle} onPreview={setPreview} />)}</div>
          : <p className="text-[10px] text-muted-foreground">{kind === 'avatar' ? 'Hareketli avatar yükleme altyapısı henüz bağlı değil.' : 'Bu kategoride henüz kozmetik kazanmadın.'}</p>}
      </div>;
    })}
    {error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
    <VipPreviewDialog preview={preview} onClose={() => setPreview(null)} />
  </section>;
}