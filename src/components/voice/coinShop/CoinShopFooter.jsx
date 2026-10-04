import { Crown, Headphones, ShieldCheck, Zap } from 'lucide-react';

const GUARANTEES = [
  { icon: ShieldCheck, title: 'Güvenli Ödeme', text: 'Tüm işlemleriniz güvence altında.' },
  { icon: Zap, title: 'Hızlı Teslimat', text: "Coins'leriniz anında hesabınızda." },
  { icon: Headphones, title: '7/24 Destek', text: 'Her zaman yanınızdayız.' },
];

/** Alt bilgi şeridi: güvenli ödeme, hızlı teslimat, destek ve kapanış cümlesi. */
export default function CoinShopFooter() {
  return (
    <div className="mt-4 border-t border-[#E8B95A]/20 pt-3">
      <div className="grid grid-cols-3 gap-2">
        {GUARANTEES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex flex-col items-center text-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#E8B95A] to-[#C5963B]">
              <Icon className="h-4 w-4 text-[#05070a]" />
            </span>
            <p className="mt-1.5 text-[11px] font-black text-white">{title}</p>
            <p className="mt-0.5 text-[9px] leading-snug text-white/60">{text}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs font-bold italic text-[#E8B95A]">
        FilmKeyfi ile her an daha keyifli! <Crown className="h-3.5 w-3.5" />
      </p>
    </div>
  );
}