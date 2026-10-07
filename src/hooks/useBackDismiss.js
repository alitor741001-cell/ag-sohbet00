import { useEffect, useRef } from 'react';
import { addLayer, removeLayer } from '@/lib/backStack';

/**
 * Açık bir katmanı birleşik geri yığınına bağlar: cihazın geri tuşu, kenardan kaydırma-geri
 * hareketi ve Android geri tuşu önce bu katmanı kapatır. Katman uygulama içinden kapatılırsa
 * adres geçmişindeki kendi adımı da temizlenir.
 *
 * Yalnızca açıkken ekrana gelen katmanlarda `open` yerine sabit `true` geçilebilir.
 */
export default function useBackDismiss(open, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const token = addLayer(() => closeRef.current?.());
    return () => { if (token) removeLayer(token); };
  }, [open]);
}