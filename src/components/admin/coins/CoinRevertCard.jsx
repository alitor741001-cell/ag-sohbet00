import { useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

/** Yanlış gönderilen son coin yüklemesini geri çeker. */
export default function CoinRevertCard({ grant, onReverted }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const revert = async () => {
    if (!grant) return;
    setBusy(true);
    try {
      const response = await base44.functions.invoke('coin-admin', { action: 'revert', grant_id: grant.id });
      const reverted = Number(response.data?.reverted) || grant.amount;
      toast({ title: `${reverted.toLocaleString('tr-TR')} coin geri çekildi`, description: `${grant.user_name} hesabından düşüldü.` });
      onReverted?.();
    } catch (error) {
      toast({ title: 'Geri çekilemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1E1B39] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">Yanlış Gönderilen Coins'i Geri Çek</p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/55">
            Kullanıcıya yanlış gönderilen coin miktarını geri çekebilirsiniz. Geri çekme işlemi sadece son gönderimler için geçerlidir.
          </p>
          {grant ? (
            <p className="mt-2 text-[11px] font-semibold text-amber-300">
              Son gönderim: {Number(grant.amount || 0).toLocaleString('tr-TR')} coin • {grant.user_name}
            </p>
          ) : (
            <p className="mt-2 text-[11px] font-semibold text-white/40">Geri çekilecek aktif gönderim yok.</p>
          )}
        </div>
        <button
          type="button"
          onClick={revert}
          disabled={!grant || busy}
          className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-[#6C5CFF]/60 bg-[#6C5CFF]/15 px-3.5 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Geri Çek
        </button>
      </div>
    </div>
  );
}