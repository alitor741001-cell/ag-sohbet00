import { useState } from 'react';
import { Loader2, RotateCcw, Undo2 } from 'lucide-react';
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
    <div className="flex items-center gap-3 rounded-2xl border border-[#F59E0B]/70 bg-[#13131E] p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#F59E0B]/50 bg-[#F59E0B]/10">
        <Undo2 className="h-5 w-5 text-[#F59E0B]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">Yanlış Gönderilen Coins'i Geri Çek</p>
        <p className="mt-1 text-[10px] leading-relaxed text-white/55">
          Kullanıcıya yanlış gönderilen coin miktarını geri çekebilirsiniz. Geri çekme işlemi sadece son gönderimler için geçerlidir.
        </p>
        {grant && (
          <p className="mt-1.5 text-[10px] font-semibold text-[#F59E0B]">
            Son gönderim: {Number(grant.amount || 0).toLocaleString('tr-TR')} coin • {grant.user_name}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={revert}
        disabled={!grant || busy}
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[#F59E0B] px-3 text-xs font-bold text-[#F59E0B] transition-transform active:scale-95 disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} Geri Çek
      </button>
    </div>
  );
}