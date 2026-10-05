import { useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { agencyApi } from '@/lib/agency';

/** Bildirim merkezine düşen yayıncı davetini kabul etme / reddetme düğmeleri. */
export default function AgencyInviteActions({ inviteId, onAnswered }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState('');

  const respond = async (accept) => {
    if (busy) return;
    setBusy(accept ? 'accept' : 'reject');
    try {
      await agencyApi('invite-respond', { invite_id: inviteId, accept });
      toast(accept
        ? { title: '🎤 Ajansa katıldın', description: 'Artık bu ajansın yayıncısısın.' }
        : { title: 'Davet reddedildi' });
      onAnswered?.(accept);
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <button onClick={() => respond(true)} disabled={!!busy} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground active:scale-95 disabled:opacity-60">
        {busy === 'accept' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Kabul Et
      </button>
      <button onClick={() => respond(false)} disabled={!!busy} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-foreground active:scale-95 disabled:opacity-60">
        {busy === 'reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Reddet
      </button>
    </div>
  );
}