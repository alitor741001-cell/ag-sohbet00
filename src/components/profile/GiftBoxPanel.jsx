import { useCallback, useEffect, useState } from 'react';
import { Gem, Loader2, Send, Wallet, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { formatCoins } from '@/lib/giftTone';
import { formatScore } from '@/components/voice/scoreTier';

const MIN_DOLLARS = 1;

const formatTl = (value) => `${(Number(value) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

/**
 * Hediye kutusu: hediyelerden biriken bakiye (TL), kimlik numarası,
 * kimlik numarasıyla başkasına gönderim ve bakiye çekme talebi.
 * Bakiye, piyasa kuru eksi 2 TL üzerinden otomatik hesaplanır.
 */
export default function GiftBoxPanel({ open, onClose }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [person, setPerson] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [dollars, setDollars] = useState('1');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('gift-box', { action: 'summary' });
      setSummary(response.data);
    } catch {
      // Bakiye alınamazsa kutu son bilinen değerle kalır.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setMemberId('');
    setPerson(null);
    setLookupError('');
    setNotice('');
    setDollars('1');
    load();
  }, [open, load]);

  // Kimlik numarası yazıldıkça kişinin profili ve ismi altında görünür.
  useEffect(() => {
    if (!open) return undefined;
    const query = memberId.trim();
    setPerson(null);
    if (query.length < 5) {
      setLookupError('');
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await base44.functions.invoke('gift-box', { action: 'lookup', member_id: query });
        if (cancelled) return;
        setPerson(response.data?.person || null);
        setLookupError('');
      } catch (error) {
        if (cancelled) return;
        setPerson(null);
        setLookupError(error?.response?.data?.error || 'Üye bulunamadı.');
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [memberId, open]);

  const amount = () => Math.round((Number(String(dollars).replace(',', '.')) || 0) * 100) / 100;

  const send = async () => {
    if (!person) return;
    const value = amount();
    if (value < MIN_DOLLARS) { setNotice(`En az ${MIN_DOLLARS} dolar gönderilebilir.`); return; }
    setBusy(true);
    setNotice('');
    try {
      const response = await base44.functions.invoke('gift-box', {
        action: 'send',
        member_id: person.member_id || memberId.trim(),
        dollars: value,
      });
      const data = response.data || {};
      if (data.balance) setSummary(data.balance);
      setNotice(`${value.toFixed(2)} $ (${formatTl(value * tlRate)}) gönderildi — ${formatCoins(data.coins || 0)} coin ${person.name} hesabına geçti.`);
      setPerson(null);
      setMemberId('');
    } catch (error) {
      setNotice(error?.response?.data?.error || 'Gönderilemedi.');
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    setBusy(true);
    setNotice('');
    try {
      const response = await base44.functions.invoke('gift-box', { action: 'withdraw' });
      const data = response.data || {};
      if (data.balance) setSummary(data.balance);
      setNotice(`Çekim talebin alındı — ${formatTl(data.tl || availableTl)} onaydan sonra ödenir.`);
    } catch (error) {
      setNotice(error?.response?.data?.error || 'Talep oluşturulamadı.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const available = Number(summary?.available_dollars) || 0;
  const availableTl = Number(summary?.available_tl) || 0;
  const tlRate = Number(summary?.tl_rate) || 0;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-[370px] overflow-y-auto rounded-2xl border border-white/10 bg-[#121215] p-4"
        style={{ boxShadow: '0 24px 70px -18px rgba(0,0,0,0.9)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            <Gem className="h-4 w-4 text-sky-400" /> Hediye Kutusu
          </p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Bakiye — dolar tutarı ve TL karşılığı (piyasa kuru eksi 2 TL) */}
        <div className="rounded-2xl bg-white px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <Gem className="h-6 w-6 shrink-0 text-sky-400" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-[#6b7280]">Kullanılabilir bakiye</p>
              <p className="text-xl font-bold tabular-nums text-[#1F2024]">
                {loading && !summary ? '…' : `${available.toLocaleString('tr-TR')} $`}
              </p>
              <p className="text-base font-bold tabular-nums text-emerald-600">
                {loading && !summary ? '' : formatTl(availableTl)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-bold tabular-nums text-[#1F2024]">{formatScore(summary?.received_score || 0)} 💎</p>
              <p className="text-[10px] font-semibold text-[#6b7280]">{summary?.units || 0} puan</p>
            </div>
          </div>
        </div>

        {/* Kimlik numarası */}
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2">
          <span className="text-[11px] font-semibold text-white/60">Kimlik numaran</span>
          <span className="font-mono text-sm font-bold tabular-nums text-white">{summary?.member_id || '—'}</span>
        </div>

        {/* Gönderim */}
        <div className="mt-3">
          <p className="text-[11px] font-bold text-white/60">Kimlik numarasıyla gönder</p>
          <input
            value={memberId}
            onChange={(event) => setMemberId(event.target.value)}
            inputMode="numeric"
            placeholder="Üye No (örn. 12345678)"
            className="mt-1 h-11 w-full rounded-xl bg-white/10 px-3 text-sm font-semibold text-white outline-none placeholder:text-white/35"
          />
          {person && (
            <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-white/5 px-2.5 py-2">
              <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
                {person.avatar
                  ? <Image src={person.avatar} alt={person.name} className="h-full w-full" fittingType="fill" draggable={false} />
                  : <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white/70">{person.name.trim().charAt(0)}</span>}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{person.name}</p>
                <p className="text-[10px] text-white/45">Üye No: {person.member_id || '—'}</p>
              </div>
            </div>
          )}
          {lookupError && <p className="mt-1.5 text-[11px] font-semibold text-amber-400">{lookupError}</p>}

          <div className="mt-2.5 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                value={dollars}
                onChange={(event) => setDollars(event.target.value)}
                inputMode="decimal"
                aria-label="Gönderilecek tutar (dolar)"
                className="h-11 w-full rounded-xl bg-white/10 pl-3 pr-7 text-sm font-bold tabular-nums text-white outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/50">$</span>
            </div>
            <button
              type="button"
              onClick={send}
              disabled={!person || busy}
              className="flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Gönder
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-white/45">
            1 $ gönderdiğinde karşı tarafa 5.000 coin geçer
            {amount() > 0 && tlRate > 0 ? ` • bakiyenden ${formatTl(amount() * tlRate)} düşer` : ''}.
          </p>
        </div>

        <button
          type="button"
          onClick={withdraw}
          disabled={busy || available <= 0}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-40"
        >
          <Wallet className="h-4 w-4" /> Bakiyeyi çek{availableTl > 0 ? ` (${formatTl(availableTl)})` : ''}
        </button>

        {notice && <p className="mt-2 text-center text-[11px] font-semibold text-emerald-400">{notice}</p>}
      </div>
    </div>
  );
}