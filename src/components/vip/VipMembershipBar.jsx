import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { vipVars } from '@/components/vip/vipTheme';

export default function VipMembershipBar({ theme, level, expiresAt, onBuy, busy, error, notice }) {
  const hasExpiry = level >= 5 && Number.isFinite(Date.parse(expiresAt || ''));
  const end = hasExpiry ? new Date(expiresAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  return createPortal(<footer style={vipVars(theme)} className="vip-glass fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 px-4 pb-3 pt-3 lg:bottom-0 lg:pb-[max(.75rem,env(safe-area-inset-bottom))] font-body text-foreground backdrop-blur-lg" aria-label="VIP satın alma">
    <div className="mx-auto max-w-lg">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="whitespace-nowrap text-[11px] font-black tabular-nums sm:text-sm">VIP {theme.level} · {theme.purchase_coins.toLocaleString('tr-TR')} Coins</p>
          <p className="mt-1 text-xs font-bold">30 günlük</p>
          <div className="mt-1 h-8 text-[10px] leading-4 text-muted-foreground">
            {hasExpiry ? <p>VIP {level} bitiş: <time dateTime={expiresAt}>{end}</time></p> : <p>{level >= 5 ? `VIP ${level} üyeliğin süresiz.` : 'Bitiş tarihi satın alma sonrası burada görünür.'}</p>}
          </div>
        </div>
        <button type="button" disabled={busy} onClick={onBuy} className="vip-button flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? 'İşleniyor' : 'Satın Al'}
        </button>
      </div>
      <p role={error ? 'alert' : 'status'} aria-live="polite" className={`h-8 overflow-hidden text-[10px] leading-4 ${error ? 'text-destructive' : 'text-muted-foreground'}`}>{error || notice || '\u00a0'}</p>
    </div>
  </footer>, document.body);
}