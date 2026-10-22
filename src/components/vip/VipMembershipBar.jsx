import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { vipVars } from '@/components/vip/vipTheme';

export default function VipMembershipBar({ theme, level, expiresAt, onBuy, busy, error, notice }) {
  const hasExpiry = level >= 5 && Number.isFinite(Date.parse(expiresAt || ''));
  const end = hasExpiry ? new Date(expiresAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  return createPortal(<footer style={vipVars(theme)} className="vip-purchase fixed inset-x-0 bottom-0 z-[60] mx-auto w-[calc(100%-1rem)] max-w-sm rounded-t-2xl border px-3 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 font-body" aria-label="VIP satın alma">
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1"><p className="text-xs font-bold">VIP {theme.level} · 30 gün</p><p className="mt-0.5 text-base font-black leading-tight tabular-nums">{theme.purchase_coins.toLocaleString('tr-TR')} <span className="text-xs font-semibold">Coins</span></p></div>
      <button type="button" disabled={busy} onClick={onBuy} className="vip-button flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-black disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? 'İşleniyor' : 'Satın Al'}</button>
    </div>
    <p className="vip-purchase-details mt-1 text-[11px] leading-4">{hasExpiry ? <>VIP {level} bitiş: <time dateTime={expiresAt}>{end}</time></> : level >= 5 ? `VIP ${level} üyeliğin süresiz.` : '30 günlük üyelik · Bitiş tarihi satın alımda görünür.'}</p>
    {(error || notice) && <p role={error ? 'alert' : 'status'} aria-live="polite" className="mt-1 text-xs font-semibold leading-4">{error || notice}</p>}
  </footer>, document.body);
}