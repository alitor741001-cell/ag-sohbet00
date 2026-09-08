import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

export default function CheatPanelSettings() {
  const { toast } = useToast();
  const [borderColor, setBorderColor] = useState('#ff1744');
  const [nameColor, setNameColor] = useState('#ffffff');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.functions.invoke('cheat-panel-config', { action: 'get' })
      .then((res) => {
        const s = res.data?.settings || {};
        setBorderColor(s.border_color || '#ff1744');
        setNameColor(s.name_color || '#ffffff');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke('cheat-panel-config', { action: 'set', border_color: borderColor, name_color: nameColor });
      toast({ title: 'Cheat panel ayarları güncellendi' });
    } catch (e) {
      toast({ title: 'İşlem başarısız', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4">
      <h2 className="mb-1 font-bold">Cheat Panel Ayarları</h2>
      <p className="mb-3 text-xs text-muted-foreground">Oda içi katılım bildirimlerinin çerçeve ve isim renklerini özelleştirin. Değişiklikler anlık olarak tüm odalarda görünür.</p>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-sm font-semibold">Çerçeve Rengi</span>
          <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} disabled={loading} className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent" />
          <span className="text-xs text-muted-foreground">{borderColor}</span>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm font-semibold">İsim Rengi</span>
          <input type="color" value={nameColor} onChange={(e) => setNameColor(e.target.value)} disabled={loading} className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent" />
          <span className="text-xs text-muted-foreground">{nameColor}</span>
        </label>
        <button onClick={save} disabled={saving || loading} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
      </div>
    </div>
  );
}