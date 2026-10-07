import { X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import useBackDismiss from '@/hooks/useBackDismiss';

/** Sohbette büyütülen görsel: geri tuşu da kapatır. */
export default function ImageLightbox({ url, onClose }) {
  useBackDismiss(true, onClose);

  return (
    <div onClick={onClose} className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4">
      <button type="button" onClick={onClose} className="absolute top-4 right-4 text-white p-2 min-h-11 min-w-11" aria-label="Görseli kapat">
        <X aria-hidden="true" className="w-6 h-6" />
      </button>
      <Image src={url} alt="Büyütülmüş görsel" className="max-w-full max-h-full rounded-lg" fittingType="fit" />
    </div>
  );
}