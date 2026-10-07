import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, Gem, Loader2, Lock, Send } from 'lucide-react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { giftBoxLocked } from '@/lib/giftAccess';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { formatCoins } from '@/lib/giftTone';
import { formatScore } from '@/components/voice/scoreTier';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const MIN_DOLLARS = 1;
const COINS_PER_DOLLAR = 9000;

const formatTl = (value) => `${(Number(value) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

/**
 * Hediye kutusu: hediyelerden biriken bakiye (TL), kimlik numarası ve
 * kimlik numarasıyla başkasına gönderim.
 * Bakiye, piyasa kuru eksi 2 TL üzerinden otomatik hesaplanır.
 */
export default function GiftBoxPanel({ open, onClose }) {
  const { user } = useCurrentUser();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [person, setPerson] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [dollars, setDollars] = useState('1');
  const [confirmKind, setConfirmKind] = useState(null);
  const [convertReq, setConvertReq] = useState(null);
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
    setConfirmKind(null);
    setConvertReq(null);
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
        const data = response.data || {};
        setPerson(data.person ? { ...data.person, self: !!data.self } : null);
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

  // Gönderimden önce her seferinde iptal/onayla uyarısı görünür.
  // Kendi kimlik numaran girildiyse gönderim yerine dolar coine çevrilir.
  const send = () => {
    if (!person) return;
    const value = amount();
    if (value < MIN_DOLLARS) { setNotice(`En az ${MIN_DOLLARS} dolar gönderilebilir.`); return; }
    setNotice('');
    if (person.self) {
      const max = Number(summary?.available_dollars) || 0;
      if (value > max) { setNotice(`En fazla ${max.toLocaleString('tr-TR')} $ bozdurabilirsin.`); return; }
      setConvertReq({ member_id: person.member_id || memberId.trim(), dollars: value });
      setConfirmKind('convert');
      return;
    }
    setConfirmKind('send');
  };

  const performSend = async () => {
    if (!person) return;
    const value = amount();
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

  const performConvert = async () => {
    if (!convertReq) return;
    const value = convertReq.dollars;
    setBusy(true);
    setNotice('');
    try {
      const response = await base44.functions.invoke('gift-box', {
        action: 'convert',
        member_id: convertReq.member_id,
        dollars: value,
      });
      const data = response.data || {};
      if (data.balance) setSummary(data.balance);
      setPerson(null);
      setMemberId('');
      setNotice(`${value.toFixed(2)} $ bozduruldu — hesabına ${formatCoins(data.coins || 0)} coin geçti.`);
    } catch (error) {
      setNotice(error?.response?.data?.error || 'Bozdurulamadı.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  // Yayıncı olmayan hesapta elmas/bakiye bölümü açılmaz.
  if (giftBoxLocked(user)) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
        <div className="w-full max-w-sm rounded-2xl border border-premium-gold/40 p-5 text-center" style={{ background: 'linear-gradient(150deg, rgba(38,16,16,0.96), rgba(12,8,8,0.98))' }}>
          <Lock className="mx-auto h-8 w-8 text-premium-gold" />
          <p className="mt-3 text-sm font-bold text-white">Elmas ve bakiye bölümü yayıncılara açıktır</p>
          <p className="mt-1 text-[12px] leading-relaxed text-white/60">Yayıncı olduğunuzda elmaslarınızı ve bakiyenizi buradan yönetebilirsiniz.</p>
          <button onClick={onClose} className="mt-4 w-full rounded-xl border border-white/15 py-2.5 text-sm font-semibold text-white/80">Kapat</button>
        </div>
      </div>
    );
  }

  const available = Number(summary?.available_dollars) || 0;
  const availableTl = Number(summary?.available_tl) || 0;
  const tlRate = Number(summary?.tl_rate) || 0;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-[#0F0F14] text-white">
      <header className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Geri"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition-transform active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="flex min-w-0 items-center gap-2 text-sm font-bold text-white">
          <Gem className="h-4 w-4 shrink-0 text-sky-400" /> <span className="truncate">Hediye Kutusu</span>
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-[430px]">

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
              <p className="text-xs font-bold tabular-nums text-[#1F2024]">{formatScore(summary?.month_score || 0)} 💎</p>
              <p className="text-[10px] font-semibold text-[#6b7280]">Bu ay • {summary?.units || 0} puan</p>
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
              {person?.self ? "Coin'e çevir" : 'Gönder'}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-white/45">
            {person?.self
              ? `Kendi numaranı girdin — tutar 1 $ = 9.000 coin olarak senin hesabına coin geçer${amount() > 0 ? ` (${formatCoins(amount() * COINS_PER_DOLLAR)} coin)` : ''}.`
              : `Yalnızca dolar tutarı girilir — 1 $ = 9.000 coin olarak alıcıya geçer${amount() > 0 ? ` • alıcıya ${formatCoins(amount() * COINS_PER_DOLLAR)} coin` : ''}.`}
          </p>
        </div>

        {notice && <p className="mt-2 text-center text-[11px] font-semibold text-emerald-400">{notice}</p>}

        <ConfirmDialog
          open={!!confirmKind}
          onOpenChange={(next) => { if (!next) setConfirmKind(null); }}
          title={confirmKind === 'convert' ? 'Bozdurma onayı' : 'Gönderim onayı'}
          description={confirmKind === 'convert'
            ? `${Number(convertReq?.dollars || 0).toFixed(2)} $ bozdurulacak ve hesabına ${formatCoins(Number(convertReq?.dollars || 0) * COINS_PER_DOLLAR)} coin geçecek. Kimlik numarası: ${convertReq?.member_id || '—'}.`
            : person
              ? `${amount().toFixed(2)} $ (${formatTl(amount() * tlRate)}) ${person.name} hesabına gönderilecek ve karşı tarafa ${formatCoins(amount() * COINS_PER_DOLLAR)} coin geçecek.`
              : ''}
          confirmText="Onayla"
          onConfirm={confirmKind === 'convert' ? performConvert : performSend}
        />
        </div>
      </div>
    </div>
  );
}