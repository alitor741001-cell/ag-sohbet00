import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { vipVars } from '@/components/vip/vipTheme';

export default function VipMembershipBar({ theme, level, expiresAt, onBuy, busy, error, notice }) {
  const hasExpiry = level >= 5 && Number.isFinite(Date.parse(expiresAt || ''));
  const end = hasExpiry ? new Date(expiresAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  return createPortal(<footer style={vipVars(theme)} className="vip-glass fixed inset-x-0 bottom-0 z-[60] px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 font-body text-foreground backdrop-blur-xl" aria-label="VIP satın alma">
    <div className="mx-auto max-w-lg">
      <div className="mb-3 flex items-center justify-between gap-3"><span className="text-sm font-black">VIP {theme.level}</span><span className="rounded-full border border-current/25 px-4 py-1 text-xs font-bold">30 gün</span></div>
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1"><p className="text-xl font-black leading-tight tabular-nums sm:text-2xl">{theme.purchase_coins.toLocaleString('tr-TR')}</p><p className="mt-1 text-xs text-muted-foreground">Coins · 30 günlük üyelik</p></div>
        <button type="button" disabled={busy} onClick={onBuy} className="vip-button flex min-h-12 min-w-[42%] items-center justify-center gap-2 rounded-full px-5 text-sm font-black disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? 'İşleniyor' : 'Satın Al'}</button>
      </div>
      <p className="mt-3 text-[10px] leading-4 text-muted-foreground">{hasExpiry ? <>VIP {level} bitiş: <time dateTime={expiresAt}>{end}</time></> : level >= 5 ? `VIP ${level} üyeliğin süresiz.` : 'Satın aldıktan sonra bitiş tarihi burada görünür.'}</p>
      {(error || notice) && <p role={error ? 'alert' : 'status'} aria-live="polite" className={`mt-1 text-xs leading-4 ${error ? 'text-destructive' : 'text-muted-foreground'}`}>{error || notice}</p>}
    </div>
  </footer>, document.body);
}