import { X } from 'lucide-react';
import useBackDismiss from '@/hooks/useBackDismiss';

/** Sesli oda içi alt panel — menü, koltuk ve davet pencereleri için ortak kabuk.
 *  fullHeight: panel içeriği gerektiğinde ekranın dibine kadar uzar (hediye kutusu gibi
 *  uzun listelerde alt tarafta oda arka planı görünmez, hediyeler siyah zemine kadar iner). */
export default function VoiceSheet({ open, title, onClose, children, fullHeight = false }) {
  // Geri tuşu önce bu paneli kapatır.
  useBackDismiss(open, onClose);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[245] flex flex-col justify-end">
      <button type="button" aria-label="Kapat" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={`relative w-full overflow-y-auto overscroll-contain rounded-t-3xl border-t border-white/10 bg-[#12121a] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-white ${fullHeight ? 'max-h-full' : 'max-h-[86vh]'}`}>
        <div className="mx-auto mb-3 flex w-full max-w-lg items-center justify-between gap-3">
          <p className="text-base font-bold">{title}</p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full bg-white/10 p-2">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mx-auto w-full max-w-lg">{children}</div>
      </div>
    </div>
  );
}