import { useState } from 'react';
import { ChevronDown, KeyRound, Lock, Palette, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import ThemeModeSelector from '@/components/profile/ThemeModeSelector';
import HiddenUserCard from '@/components/profile/HiddenUserCard';
import VipExtensionSettings from '@/components/profile/VipExtensionSettings';

const ROW = 'rounded-2xl border border-white/12 bg-white/[0.04] px-3.5 py-3';

/** Eklentiler: hareketli avatar, gizli profil, oda takibi, gizli kullanıcı, görünüm ve şifre. */
export default function ProfileSettings({ user, onUpdated }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });

  const submit = async (event) => {
    event.preventDefault();
    if (form.next.length < 8) {
      toast({ title: 'Yeni şifre en az 8 karakter olmalıdır', variant: 'destructive' });
      return;
    }
    if (form.next !== form.confirm) {
      toast({ title: 'Yeni şifreler eşleşmiyor', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.auth.changePassword({ userId: user.id, currentPassword: form.current, newPassword: form.next });
      setForm({ current: '', next: '', confirm: '' });
      toast({ title: 'Şifreniz değiştirildi' });
    } catch (error) {
      toast({ title: 'Şifre değiştirilemedi', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-white/35">Gizlilik ve Görünüm</p>
      <HiddenUserCard user={user} onUpdated={onUpdated} />
      <VipExtensionSettings />

      <p className="px-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-white/35">Uygulama</p>
      <div className={ROW}>
        <div className="mb-3 flex items-center gap-3">
          <Palette className="h-[18px] w-[18px] shrink-0 text-white/60" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">Görünüm</p>
            <p className="text-[11px] font-semibold text-white/45">Uygulama temasını seç</p>
          </div>
        </div>
        <ThemeModeSelector />
      </div>

      <div className={ROW}>
        <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 text-left">
          <KeyRound className="h-[18px] w-[18px] shrink-0 text-white/60" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-white">Şifre Değiştir</span>
            <span className="block text-[11px] font-semibold text-white/45">Hesabının şifresini güncelle</span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <form onSubmit={submit} className="mt-3 space-y-2.5">
            <Password label="Mevcut Şifre" value={form.current} onChange={(current) => setForm({ ...form, current })} />
            <Password label="Yeni Şifre" value={form.next} onChange={(next) => setForm({ ...form, next })} />
            <Password label="Yeni Şifre Tekrar" value={form.confirm} onChange={(confirm) => setForm({ ...form, confirm })} />
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" /> {saving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Password({ label, value, onChange }) {
  return (
    <label className="block text-[11px] font-semibold text-white/55">
      {label}
      <span className="relative mt-1 block">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
        <input
          required
          type="password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-white/15 bg-black/40 py-2.5 pl-9 pr-3 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-red-500/60"
        />
      </span>
    </label>
  );
}