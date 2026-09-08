import { useState } from 'react';
import { KeyRound, ChevronDown, ShieldOff, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import BlockedUsers from '@/components/profile/BlockedUsers';
import XpFrameSelector from '@/components/profile/XpFrameSelector';
import ProfileFrames from '@/components/profile/ProfileFrames';

import FrameEntranceToggle from '@/components/profile/FrameEntranceToggle';
import useFriends from '@/hooks/useFriends';

export default function ProfileSettings({ user, onUpdated }) {
  const { toast } = useToast(); const [saving, setSaving] = useState(false); const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const isAdmin = user?.role === 'admin';
  const submit = async (event) => {
    event.preventDefault();
    if (form.next.length < 8) return toast({ title: 'Yeni şifre en az 8 karakter olmalıdır', variant: 'destructive' });
    if (form.next !== form.confirm) return toast({ title: 'Yeni şifreler eşleşmiyor', variant: 'destructive' });
    setSaving(true);
    try {
      await base44.auth.changePassword({ userId: user.id, currentPassword: form.current, newPassword: form.next });
      setForm({ current: '', next: '', confirm: '' }); toast({ title: 'Şifreniz değiştirildi' });
    } catch (error) { toast({ title: 'Şifre değiştirilemedi', description: error.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  return <div className="space-y-5">
    {!isAdmin && <XpFrameSelector user={user} />}
    {!isAdmin && <ProfileFrames user={user} onUpdated={onUpdated} />}
    {!isAdmin && user.profile_frame && <FrameEntranceToggle user={user} onSaved={onUpdated} />}
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 space-y-3"><h2 className="flex items-center gap-2 font-bold"><KeyRound className="w-5 h-5" />Şifre Değiştir</h2><Password label="Mevcut Şifre" value={form.current} onChange={(current) => setForm({ ...form, current })} /><Password label="Yeni Şifre" value={form.next} onChange={(next) => setForm({ ...form, next })} /><Password label="Yeni Şifre Tekrar" value={form.confirm} onChange={(confirm) => setForm({ ...form, confirm })} /><button disabled={saving} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}</button></form>
    <BlockedUsersSection />
    <DeleteAccountSection />
  </div>;
}

function BlockedUsersSection() {
  const [open, setOpen] = useState(false);
  const { user, relations, loading } = useFriends();
  const count = user ? relations.filter((r) => r.status === 'blocked' && (r.blocked_by || []).includes(user.id)).length : 0;
  return <section className="rounded-2xl border border-border bg-card overflow-hidden">
    <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 p-4 text-left">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10"><ShieldOff className="w-5 h-5 text-red-400" /></div>
      <div className="flex-1">
        <p className="font-bold">Engellenenler Listesi</p>
        <p className="text-xs text-muted-foreground">{count > 0 ? `${count} engellenen üye` : 'Engellenen üye yok'}</p>
      </div>
      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="border-t border-border p-4"><BlockedUsers /></div>}
  </section>;
}

function DeleteAccountSection() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.functions.invoke('delete-account', {});
      toast({ title: 'Hesabınız silindi' });
      await base44.auth.logout();
      window.location.href = '/login';
    } catch (error) {
      toast({ title: 'Hesap silinemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
      setDeleting(false);
      setStep(0);
      setConfirmText('');
    }
  };

  const close = () => {
    if (deleting) return;
    setStep(0);
    setConfirmText('');
  };

  if (step === 0) return (
    <button onClick={() => setStep(1)} className="flex w-full items-center gap-3 p-4 text-left rounded-2xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10"><Trash2 className="w-5 h-5 text-destructive" /></div>
      <div className="flex-1">
        <p className="font-bold text-destructive">Hesabımı Sil</p>
        <p className="text-xs text-muted-foreground">Hesabınızı ve tüm verilerinizi kalıcı olarak silin (GDPR)</p>
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4" onClick={close}>
      <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 text-foreground" onClick={(e) => e.stopPropagation()}>
        {step === 1 && (<>
          <h3 className="text-lg font-bold text-destructive mb-2">Hesabını silmek istediğine emin misin?</h3>
          <p className="text-sm text-muted-foreground mb-4">Bu işlem tüm verilerini kalıcı olarak siler ve geri alınamaz. Favorilerin, izleme geçmişin, mesajların, arkadaşlıkların ve aboneliğin tamamen silinecek.</p>
          <div className="flex gap-2">
            <button onClick={close} disabled={deleting} className="flex-1 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold">Vazgeç</button>
            <button onClick={() => setStep(2)} disabled={deleting} className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground">Evet, devam et</button>
          </div>
        </>)}
        {step === 2 && (<>
          <h3 className="text-lg font-bold text-destructive mb-2">Son onay</h3>
          <p className="text-sm text-muted-foreground mb-2">Silme işlemini onaylamak için <span className="font-bold text-destructive">SİL</span> yazın:</p>
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="SİL" className="w-full rounded-lg bg-secondary px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-ring mb-4" disabled={deleting} />
          <div className="flex gap-2">
            <button onClick={() => { setStep(1); setConfirmText(''); }} disabled={deleting} className="flex-1 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold">Geri</button>
            <button onClick={handleDelete} disabled={deleting || confirmText !== 'SİL'} className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground disabled:opacity-50">{deleting ? 'Siliniyor...' : 'Hesabımı Kalıcı Olarak Sil'}</button>
          </div>
        </>)}
      </div>
    </div>
  );
}

function Password({ label, value, onChange }) { return <label className="block text-sm text-muted-foreground">{label}<input required type="password" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg bg-secondary px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-ring" /></label>; }