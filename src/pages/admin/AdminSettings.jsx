import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState({ registration_open: true, payment_required: true, payment_available: true, maintenance_mode: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.functions.invoke('public-settings', {}).then((res) => { const s = res.data || res; setSettings({ registration_open: s.registration_open !== false, payment_required: s.payment_required !== false, payment_available: s.payment_available !== false, maintenance_mode: s.maintenance_mode === true }); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try { await base44.functions.invoke('admin-settings', { action: 'update', ...settings }); toast({ title: 'Ayarlar kaydedildi' }); }
    catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Ayarlar</h1>
      <div className="max-w-md space-y-4 rounded-xl bg-card border border-border p-4">
        <label className="flex items-center justify-between"><span className="text-sm text-white">Kayıtlar Açık</span><input type="checkbox" checked={settings.registration_open} onChange={(e) => setSettings({ ...settings, registration_open: e.target.checked })} className="w-5 h-5 accent-purple-600" /></label>
        <label className="flex items-center justify-between"><span className="text-sm text-white">Ödeme Zorunlu</span><input type="checkbox" checked={settings.payment_required} onChange={(e) => setSettings({ ...settings, payment_required: e.target.checked })} className="w-5 h-5 accent-purple-600" /></label>
        <label className="flex items-center justify-between"><span className="text-sm text-white">Ödeme Aktif</span><input type="checkbox" checked={settings.payment_available} onChange={(e) => setSettings({ ...settings, payment_available: e.target.checked })} className="w-5 h-5 accent-purple-600" /></label>
        <label className="flex items-center justify-between"><span className="text-sm text-white">Bakım Modu</span><input type="checkbox" checked={settings.maintenance_mode} onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })} className="w-5 h-5 accent-purple-600" /></label>
        <Button onClick={save} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700 text-white">{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Kaydet</Button>
      </div>
    </div>
  );
}