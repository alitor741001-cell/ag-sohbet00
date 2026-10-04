import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Search, Send, UserRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { useToast } from '@/components/ui/use-toast';

const STEP = 1000;
const FIELD = 'w-full rounded-xl border border-white/10 bg-[#171432] text-sm text-white outline-none placeholder:text-white/35 focus:border-[#6C5CFF]';
const GRADIENT = 'linear-gradient(135deg, #4E44FF, #8E43FF)';

/** Admin: kimlik numarası, kullanıcı adı ya da ID ile seçilen kişiye coin yükler. */
export default function CoinLoadForm({ onGranted }) {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [person, setPerson] = useState(null);
  const [searching, setSearching] = useState(false);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async () => {
    const value = query.trim();
    if (!value) return;
    setSearching(true);
    setPerson(null);
    try {
      const response = await base44.functions.invoke('coin-admin', { action: 'lookup', query: value });
      const found = response.data?.person || null;
      setPerson(found);
      if (!found) toast({ title: 'Kullanıcı bulunamadı', variant: 'destructive' });
    } catch (error) {
      toast({ title: 'Kullanıcı bulunamadı', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const send = async () => {
    if (!person) { toast({ title: 'Önce bir kullanıcı seç', variant: 'destructive' }); return; }
    if (!amount || amount < 1) { toast({ title: 'Yüklenecek coin miktarını gir', variant: 'destructive' }); return; }
    setBusy(true);
    try {
      const response = await base44.functions.invoke('coin-admin', {
        action: 'grant', user_id: person.user_id, amount, note,
      });
      const data = response.data || {};
      toast({
        title: `${amount.toLocaleString('tr-TR')} coin yüklendi`,
        description: `${person.name} • yeni bakiye ${Number(data.coins || 0).toLocaleString('tr-TR')} coin`,
      });
      setPerson({ ...person, coins: Number(data.coins) || person.coins });
      setAmount(0);
      setNote('');
      onGranted?.();
    } catch (error) {
      toast({ title: 'Yükleme başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1E1B39] p-4">
      <p className="mb-1.5 text-[11px] font-bold text-white/60">Kullanıcı Seç</p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') search(); }}
            placeholder="Kullanıcı ID / Kimlik No / Kullanıcı Adı"
            aria-label="Kullanıcı ara"
            className={`${FIELD} h-11 pl-9 pr-3`}
          />
        </div>
        <button
          type="button"
          onClick={search}
          disabled={searching}
          aria-label="Kullanıcıyı ara"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-transform active:scale-95 disabled:opacity-50"
          style={{ background: GRADIENT }}
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </div>

      {person && (
        <div className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5">
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
            {person.avatar ? (
              <Image src={person.avatar} alt={person.name} className="h-full w-full" fittingType="fill" draggable={false} />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white/70">
                {String(person.name || '?').trim().charAt(0).toUpperCase()}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{person.name}</p>
            <p className="truncate text-[10px] text-white/45">Kimlik: {person.member_id || '—'}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold tabular-nums text-amber-300">{Number(person.coins || 0).toLocaleString('tr-TR')}</p>
            <p className="text-[10px] font-semibold text-white/45">coin</p>
          </div>
        </div>
      )}

      <p className="mb-1.5 mt-3.5 text-[11px] font-bold text-white/60">Yüklenecek Coin Miktarı</p>
      <div className="flex items-center gap-2">
        <input
          value={amount}
          onChange={(event) => setAmount(Math.max(0, Math.floor(Number(event.target.value.replace(/\D/g, '')) || 0)))}
          inputMode="numeric"
          aria-label="Yüklenecek coin miktarı"
          className={`${FIELD} h-11 flex-1 px-3 font-bold tabular-nums`}
        />
        <div className="flex shrink-0 flex-col gap-1">
          <button type="button" onClick={() => setAmount((value) => value + STEP)} aria-label="Miktarı artır" className="flex h-5 w-10 items-center justify-center rounded-md bg-white/10 text-white active:scale-95">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => setAmount((value) => Math.max(0, value - STEP))} aria-label="Miktarı azalt" className="flex h-5 w-10 items-center justify-center rounded-md bg-white/10 text-white active:scale-95">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <p className="mb-1.5 mt-3.5 text-[11px] font-bold text-white/60">Açıklama (İsteğe Bağlı)</p>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        placeholder="Örn: Özel etkinlik, hediye vb."
        className={`${FIELD} px-3 py-2.5`}
      />

      <button
        type="button"
        onClick={send}
        disabled={busy || !person || amount < 1}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-transform active:scale-[0.99] disabled:opacity-50"
        style={{ background: GRADIENT }}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gönder
      </button>
    </div>
  );
}