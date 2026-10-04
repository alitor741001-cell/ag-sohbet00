import { Clock } from 'lucide-react';
import { formatCoins } from '@/lib/giftTone';

const formatWhen = (value) => {
  try {
    return new Date(value).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

/** Bekleyen coin başvurusu bilgisi — admin coinsi yükleyince kendiliğinden kaybolur. */
export default function CoinPendingNotice({ request }) {
  if (!request) return null;
  return (
    <div className="mt-3 rounded-xl border border-[#E8B95A]/60 bg-[#E8B95A]/10 px-3.5 py-3">
      <p className="flex items-center gap-2 text-sm font-black text-[#E8B95A]">
        <Clock className="h-4 w-4" /> Başvurunuz bekleniyor
      </p>
      <p className="mt-1 text-[11px] font-semibold text-white/80">
        {request.package_name || `${formatCoins(request.coins)} Coins`} • {formatWhen(request.created_date)}
      </p>
      <p className="mt-0.5 text-[10px] text-white/55">Ödemen onaylandığında coins hesabına yüklenecek.</p>
    </div>
  );
}