import { X } from 'lucide-react';
import useBackDismiss from '@/hooks/useBackDismiss';
import usePageScrollLock from '@/hooks/usePageScrollLock';

/** Sesli oda içi alt panel — menü, koltuk ve davet pencereleri için ortak kabuk.
 *  halfHeight: telefonlarda panel ekranın yarısı kadar açılır (hediye kutusu); içerik
 *  kendi içinde kayar, daha geniş ekranlarda 86vh sınırı geçerli kalır. */
export default function VoiceSheet({ open, title, onClose, children, halfHeight = false, tall = false, hideTitle = false, panelClass = 'bg-[#12121a]' }) {
  // Geri tuşu önce bu paneli kapatır.
  useBackDismiss(open, onClose);
  usePageScrollLock(open);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[245] flex flex-col justify-end pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <button type="button" aria-label="Kapat" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={`relative flex w-full flex-col rounded-t-3xl border-t border-white/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-white ${panelClass} ${tall ? 'voice-sheet-tall overflow-hidden' : halfHeight ? 'voice-sheet-half overflow-hidden' : 'max-h-[86dvh] overflow-y-auto overscroll-contain'}`}>
        {/* hideTitle: panel kendi başlığını çizer (hediye kutusu). */}
        {!hideTitle && (
          <div className="mx-auto mb-3 flex w-full max-w-lg shrink-0 items-center justify-between gap-3">
            <p className="text-base font-bold">{title}</p>
            <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full bg-white/10 p-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {/* halfHeight / tall: başlık sabit kalır, gövde kalan alanı kaplar — kaydırma yalnızca
            içerikteki listeye (hediye ızgarası) aittir. Gövde kolon olarak kurulmazsa içerik
            panelin boyunu aşar ve alttaki satırlar (alıcılar, Gönder) kırpılır. */}
        <div className={`mx-auto w-full max-w-lg ${halfHeight || tall ? 'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain' : ''}`}>{children}</div>
      </div>
    </div>
  );
}