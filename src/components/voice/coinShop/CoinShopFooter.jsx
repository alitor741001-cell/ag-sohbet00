import { Crown, Headphones, ShieldCheck, Zap } from 'lucide-react';

const GUARANTEES = [
  { icon: ShieldCheck, title: 'Güvenli Ödeme', text: 'İşlemleriniz güvence altında.' },
  { icon: Zap, title: 'Hızlı Teslimat', text: "Coins'ler anında hesabınızda." },
  { icon: Headphones, title: '7/24 Destek', text: 'Her zaman yanınızdayız.' },
];

/** Alt bilgi şeridi: cam kartlar içinde güvenli ödeme, hızlı teslimat ve destek. */
export default function CoinShopFooter() {
  return (
    <div className="mt-5">
      <div className="grid grid-cols-3 gap-2">
        {GUARANTEES.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="flex flex-col items-center rounded-xl px-1.5 py-2.5 text-center"
            style={{
              background: 'linear-gradient(180deg, rgba(19,34,56,0.8), rgba(7,12,21,0.85))',
              border: '1px solid rgba(232,185,90,0.22)',
              boxShadow: 'inset 0 1px 0 rgba(255,246,214,0.1)',
            }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: 'radial-gradient(circle at 50% 30%, #fff2c4, #e0b73f 58%, #8a6a1c 100%)', boxShadow: '0 0 12px rgba(232,185,90,0.4)' }}
            >
              <Icon className="h-4 w-4 text-[#2b1602]" strokeWidth={2.4} />
            </span>
            <p className="mt-1.5 text-[10.5px] font-black text-white">{title}</p>
            <p className="mt-0.5 text-[9px] leading-snug text-white/55">{text}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] font-black italic text-[#E8B95A]">
        Her an daha keyifli! <Crown className="h-3.5 w-3.5" />
      </p>
    </div>
  );
}