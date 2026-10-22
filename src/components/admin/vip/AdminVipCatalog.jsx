import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import VipLevelEditor from '@/components/admin/vip/VipLevelEditor';
import VipFeatureEditor from '@/components/admin/vip/VipFeatureEditor';
export default function AdminVipCatalog() {
  const [catalog, setCatalog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const load = async () => {
    try { setCatalog((await base44.functions.invoke('vip-cosmetics', { action: 'catalog' })).data.catalog); }
    catch (error) { setNotice(error.response?.data?.error || 'VIP ayarları yüklenemedi.'); }
  };
  useEffect(() => { load(); }, []);
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setNotice('');
    try { const response = await base44.functions.invoke('vip-cosmetics', { action: 'saveCatalog', catalog }); setCatalog(response.data.catalog); setNotice('VIP ayarları kaydedildi.'); }
    catch (error) { setNotice(error.response?.data?.error || 'Ayarlar kaydedilemedi.'); }
    finally { setBusy(false); }
  };
  return <details className="mb-5 rounded-2xl border border-border bg-card p-4 text-card-foreground">
    <summary className="cursor-pointer font-bold">VIP 5–12 · Tasarım ve ayrıcalık ayarları</summary>
    {catalog ? <form onSubmit={save} className="mt-4 space-y-3">
      {catalog.levels.map((theme) => <VipLevelEditor key={theme.level} theme={theme} onChange={(patch) => setCatalog((current) => ({ ...current, levels: current.levels.map((item) => item.level === theme.level ? { ...item, ...patch } : item) }))} />)}
      <VipFeatureEditor features={catalog.features} levels={catalog.levels} onChange={(key, minLevel) => setCatalog((current) => ({ ...current, features: current.features.map((feature) => feature.key === key ? { ...feature, minLevel } : feature) }))} />
      <p className="text-[10px] text-muted-foreground">Süre, üyelik atamasında “Seviye süresi” seçilince uygulanır. Mevcut jeton kazanım kuralları ve aktif üyelik süreleri değişmez. Doğrudan VIP satışı açılmaz.</p>
      <button disabled={busy} type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{busy ? 'Kaydediliyor…' : 'Ayarları Kaydet'}</button>
    </form> : <button onClick={load} className="mt-3 text-sm">Ayarları yükle</button>}
    {notice && <p role="status" className="mt-3 text-xs">{notice}</p>}
  </details>;
}