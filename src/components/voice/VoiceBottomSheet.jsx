import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import useBackDismiss from '@/hooks/useBackDismiss';

/** Alttan yukarı kayarak açılan yarı yükseklik sayfa — boş alana dokununca veya X ile kapanır. */
export default function VoiceBottomSheet({ open, title, onClose, children }) {
  const [visible, setVisible] = useState(false);

  // Geri tuşu önce bu sayfayı kapatır.
  useBackDismiss(open, onClose);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return undefined;
    }
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-end bg-black/60" onClick={onClose} role="presentation">
      <div
        className={`flex h-[58vh] w-full flex-col rounded-t-3xl bg-white pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        <span className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-black/15" />
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-2">
          <p className="text-sm font-bold text-[#1F2024]">{title}</p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 text-[#1F2024] transition-colors hover:bg-black/5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-2">{children}</div>
      </div>
    </div>
  );
}