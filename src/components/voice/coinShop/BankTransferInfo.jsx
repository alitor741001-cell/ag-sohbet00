import { useState } from 'react';
import { Check, Copy, Landmark } from 'lucide-react';

const formatTl = (value) => `${Math.max(0, Number(value) || 0).toLocaleString('tr-TR')} ₺`;

/** Tek bilgi satırı: etiket, değer ve istenirse kopyala butonu. */
function Line({ label, value, mono, copied, onCopy }) {
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-white/50">{label}</p>
        <p className={`break-all text-sm font-bold text-white ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
      </div>
      {onCopy && value ? (
        <button
          type="button"
          onClick={onCopy}
          aria-label={`${label} kopyala`}
          className="mt-3.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#E8B95A] transition-transform active:scale-95"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      ) : null}
    </div>
  );
}

/** Havale/EFT bilgileri: banka, isim soyisim, IBAN, şube ve tutar (kopyalanabilir). */
export default function BankTransferInfo({ bank, pack }) {
  const [copied, setCopied] = useState('');

  const copy = (key, value) => {
    if (!value) return;
    navigator.clipboard?.writeText(String(value));
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  if (!bank) {
    return (
      <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-3 text-[11px] font-semibold text-amber-300">
        Banka bilgileri şu anda görüntülenemiyor. Lütfen daha sonra tekrar dene.
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-[#E8B95A]/55 bg-gradient-to-b from-[#16120f] to-[#050505] px-3.5 py-3 shadow-[inset_0_0_0_1px_rgba(255,236,190,0.14),inset_0_1px_0_rgba(255,246,214,0.24)]">
      <p className="flex items-center gap-2 text-sm font-black text-white">
        <Landmark className="h-4 w-4 text-[#E8B95A]" /> Banka Transferi Bilgileri
      </p>
      <div className="mt-2.5 space-y-2.5">
        <Line label="Banka" value={bank.bank_name} />
        <Line
          label="İsim Soyisim"
          value={bank.account_holder}
          copied={copied === 'holder'}
          onCopy={() => copy('holder', bank.account_holder)}
        />
        <Line
          label="IBAN"
          value={bank.iban}
          mono
          copied={copied === 'iban'}
          onCopy={() => copy('iban', bank.iban)}
        />
        {bank.branch && <Line label="Şube" value={bank.branch} />}
        <Line
          label="Gönderilecek Tutar"
          value={formatTl(pack?.price)}
          copied={copied === 'amount'}
          onCopy={() => copy('amount', pack?.price)}
        />
      </div>
      <p className="mt-2.5 text-[10px] leading-snug text-white/55">
        Transfer açıklamasına kullanıcı adını yazmayı unutma, sonra aşağıdaki "Ödeme yaptım" butonuna bas.
      </p>
    </div>
  );
}