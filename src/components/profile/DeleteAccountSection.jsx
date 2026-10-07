import { useState } from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

/** Hesabımı Sil satırı ve iki adımlı silme onayı. */
export default function DeleteAccountSection() {
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
    <button
      onClick={() => setStep(1)}
      className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-transform active:scale-[0.98]"
      style={{
        background: 'linear-gradient(135deg, rgba(255,45,45,0.14), rgba(255,45,45,0.03))',
        border: '1px solid rgba(255,82,82,0.5)',
        boxShadow: '0 0 16px rgba(255,45,45,0.18)',
      }}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
        <Trash2 className="h-5 w-5 text-red-400" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-red-400">Hesabımı Sil</span>
        <span className="block truncate text-[11px] text-white/55">Hesabınızı ve tüm verilerinizi kalıcı olarak silin (GDPR)</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-red-300/50" />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4" onClick={close}>
      <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 text-foreground" onClick={(e) => e.stopPropagation()}>
        {step === 1 && (<>
          <h3 className="text-lg font-bold text-destructive mb-2">Hesabını silmek istediğine emin misin?</h3>
          <p className="text-sm text-muted-foreground mb-4">Bu işlem tüm verilerini kalıcı olarak siler ve geri alınamaz. Mesajların, arkadaşlıkların ve kişisel bilgilerin tamamen silinecek.</p>
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