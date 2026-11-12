import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * Kullanıcı adı olmayan hesaplar (ör. sosyal girişle gelenler) bir kez kullanıcı adı seçer:
 * uygulamada e-posta veya hesaptaki gerçek ad yerine her yerde bu ad görünür.
 */
export default function UsernameGate({ user }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!user?.id || user.username || done) return null;

  const submit = async (event) => {
    event.preventDefault();
    const value = name.trim();
    if (value.length < 3) { setError('Kullanıcı adı en az 3 karakter olmalı.'); return; }
    setSaving(true);
    setError('');
    try {
      await base44.functions.invoke('update-profile', { username: value });
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.error || 'Kullanıcı adı kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xl">
        <h2 className="text-lg font-black">Kullanıcı adını belirle</h2>
        <p className="mt-1 text-xs text-muted-foreground">Diğer kullanıcılar seni yalnızca bu adla görür. E-posta adresin ve gerçek adın gösterilmez.</p>
        <Input className="mt-4" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Kullanıcı adı" autoComplete="username" />
        {error && <p className="mt-2 text-xs font-bold text-destructive">{error}</p>}
        <Button type="submit" className="mt-4 w-full" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kaydet
        </Button>
      </form>
    </div>
  );
}