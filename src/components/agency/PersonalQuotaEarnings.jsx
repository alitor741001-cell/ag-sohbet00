import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import QuotaEarningsCard from '@/components/agency/QuotaEarningsCard';
import EarningsHistory from '@/components/agency/EarningsHistory';
import { agencyApi } from '@/lib/agency';

export default function PersonalQuotaEarnings({ data }) {
  const [history, setHistory] = useState(data);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setHistory(data); setError(''); }, [data]);
  const more = async () => {
    if (loading) return;
    setLoading(true); setError('');
    try {
      const next = await agencyApi('broadcaster', { cursor: history.next_cursor });
      setHistory(prev => ({ ...next, rewards: [...new Map([...(prev?.rewards || []), ...next.rewards].map(row => [row.id, row])).values()] }));
    } catch (failure) { setError(failure.response?.data?.error || 'Kazanç geçmişi yüklenemedi. Tekrar dene.'); }
    finally { setLoading(false); }
  };
  return (
    <div className="space-y-4">
      <QuotaEarningsCard month={data?.diamonds?.month || 0} period={data?.period || ''} nextTier={data?.next_tier} rewards={data?.rewards || []} summary={data?.monthly} />
      <EarningsHistory rewards={history?.rewards || []} totals={data?.totals || {}} />
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      {history?.has_more && <button type="button" disabled={loading} onClick={more} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary py-3 text-xs font-bold text-foreground disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Daha fazla göster</button>}
    </div>
  );
}