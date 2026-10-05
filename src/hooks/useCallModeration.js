import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { captureTrackFrame } from '@/lib/callFrame';

// Canlı görüntülü aramada kamera açıkken belirli aralıklarla kare alınır ve
// sunucuda yapay zekâ ile çıplaklık denetimi yapılır. İhlalde arama anında kapanır,
// hesaba uyarı düşer; 3. ihlalde hesap kapatılır.
const SCAN_MS = 5000;
const FIRST_SCAN_MS = 3000;

export default function useCallModeration({ callId, active, track, onViolation }) {
  const [notice, setNotice] = useState(null);
  const flaggedRef = useRef(false);

  useEffect(() => {
    if (!active || !callId || !track) return undefined;
    let cancelled = false;
    let busy = false;

    const scan = async () => {
      if (busy || cancelled || flaggedRef.current) return;
      busy = true;
      try {
        const frame = await captureTrackFrame(track);
        if (!frame || cancelled) return;
        const upload = await base44.integrations.Core.UploadPrivateFile({ file: frame });
        if (!upload?.file_uri || cancelled) return;
        const response = await base44.functions.invoke('call-moderation', { call_id: callId, frame_uri: upload.file_uri });
        const data = response?.data;
        if (cancelled || !data?.flagged) return;
        flaggedRef.current = true;
        setNotice({
          message: data.message || 'Görüntülü aramada uygunsuz görüntü paylaştığınız tespit edildi ve arama kapatıldı.',
          strikes: data.strikes || 1,
          deleted: !!data.deleted,
        });
        onViolation?.();
      } catch {
        // Ağ hatasında bir sonraki turda yeniden denenir.
      } finally {
        busy = false;
      }
    };

    const first = window.setTimeout(scan, FIRST_SCAN_MS);
    const timer = window.setInterval(scan, SCAN_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [active, callId, track, onViolation]);

  // Yeni aramada denetim yeniden başlar.
  useEffect(() => { flaggedRef.current = false; }, [callId]);

  const clearNotice = useCallback(() => setNotice(null), []);

  return { notice, clearNotice };
}