import { useCallback, useEffect, useState } from 'react';
import { Crown, Loader2, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import VipUserRow from '@/components/admin/vip/VipUserRow';
import { useToast } from '@/components/ui/use-toast';

/** VIP Merkezi: kullanıcı arar, VIP5–VIP12 (ve 10–12 özel) seviyesi verir ya da kaldırır. */
export default function AdminVip() {
  const { toast } = useToast();
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('vip-service', { action: 'list' });
      setPeople(response.data?.people || []);
    } catch {
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const search = async () => {
    if (!query.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await base44.functions.invoke('vip-service', { action: 'search', query: query.trim() });
      const found = response.data?.people || [];
      setPeople(found);
      if (!found.length) setMessage('Kullanıcı bulunamadı.');
    } catch (error) {
      setPeople([]);
      setMessage(error.response?.data?.error || 'Kullanıcı bulunamadı.');
    } finally {
      setBusy(false);
    }
  };

  const setVip = async (userId, level) => {
    setBusy(true);
    try {
      const response = await base44.functions.invoke('vip-service', { action: 'set', user_id: userId, vip_level: level });
      const updated = response.data?.person;
      setPeople((prev) => prev.map((person) => (person.user_id === userId ? { ...person, ...updated } : person)));
      toast({ title: level > 0 ? `VIP${level} verildi` : 'VIP kaldırıldı' });
    } catch (error) {
      toast({ title: 'İşlem yapılamadı', description: error.response?.data?.error, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl pb-6">
      <div className="mb-4 flex items-center justify-center gap-2 py-1 text-center">
        <Crown className="h-6 w-6 text-amber-400" />
        <div>
          <h1 className="text-2xl font-extrabold text-white">VIP Merkezi</h1>
          <p className="mt-1 text-[11px] leading-relaxed text-white/55">
            VIP5–VIP9 rozet verir; VIP10–VIP12 özel rozet taşır. VIP8 ve üzeri isimler kırmızı görünür.
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') search(); }}
          placeholder="Kimlik no, kullanıcı adı ya da e-posta"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none"
        />
        <button
          type="button"
          onClick={search}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2.5 text-sm font-bold text-black disabled:opacity-60"
        >
          <Search className="h-4 w-4" /> Ara
        </button>
      </div>

      {message && <p className="mb-3 text-center text-xs font-semibold text-white/60">{message}</p>}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>
      ) : people.length === 0 ? (
        <p className="py-10 text-center text-sm text-white/50">VIP verecek kişiyi yukarıdan arayabilirsin.</p>
      ) : (
        <div className="space-y-2.5">
          {people.map((person) => (
            <VipUserRow key={person.user_id} person={person} busy={busy} onSet={setVip} />
          ))}
        </div>
      )}
    </div>
  );
}