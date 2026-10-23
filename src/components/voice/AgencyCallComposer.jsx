import { useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import VoiceSheet from '@/components/voice/VoiceSheet';

/** Ajans çağrısı gönderme penceresi; açıklama isteğe bağlıdır. */
export default function AgencyCallComposer({ open, onClose, roomId, status, onSent }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (!open) { setMessage(''); setError(''); } }, [open]);

  const send = async () => {
    setSending(true); setError('');
    try {
      const res = await base44.functions.invoke('agency-call', { action: 'send', room_id: roomId, message });
      onSent?.(res.data);
      onClose();
    } catch (failure) {
      setError(failure.response?.data?.error || 'Çağrı gönderilemedi.');
    } finally { setSending(false); }
  };

  return (
    <VoiceSheet open={open} onClose={onClose} title="Ajans Çağrısı">
      <p className="text-xs text-white/60">Kalan hak: {status?.remaining ?? 0}/{status?.limit ?? 0} (bugün)</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-white/35">Haklar her gece 24:00&#39;da yenilenir</p>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={200} rows={3} placeholder="Açıklama (isteğe bağlı)" className="mt-3 w-full rounded-xl bg-white/10 p-3 text-sm text-white outline-none placeholder:text-white/40" />
      {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
      <button type="button" disabled={sending || !status?.remaining} onClick={send} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FFD700] text-sm font-black text-black disabled:opacity-40">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gönder
      </button>
    </VoiceSheet>
  );
}