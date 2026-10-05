import { ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/** Canlı görüntülü aramada uygunsuz görüntü tespit edilince gösterilen uyarı ekranı. */
export default function CallModerationNotice({ notice, onClose }) {
  const close = () => {
    onClose();
    // 3. ihlalde hesap silindiği için oturum kapatılır.
    if (notice?.deleted) base44.auth.logout('/login');
  };

  return (
    <section className="fixed inset-0 z-[240] flex flex-col items-center justify-center gap-4 bg-catalog px-8 text-center text-white">
      <ShieldAlert className="h-14 w-14 text-red-500" />
      <h2 className="text-xl font-black">Uygunsuz görüntü tespit edildi</h2>
      <p className="max-w-sm text-sm text-white/75">
        {notice?.message || 'Görüntülü aramada uygunsuz görüntü paylaştığınız tespit edildi ve arama kapatıldı.'}
      </p>
      {!notice?.deleted && (
        <p className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold">Uyarı {notice?.strikes || 1}/3</p>
      )}
      <button
        type="button"
        onClick={close}
        className="mt-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground active:scale-95"
      >
        Anladım
      </button>
    </section>
  );
}