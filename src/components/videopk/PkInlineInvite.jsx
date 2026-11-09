import { Check, Clock3, Loader2, X } from 'lucide-react';
import { PK_INVITE_TTL_MS } from '@/hooks/useVideoPk';

/**
 * Gelen PK daveti, davet onay düğmesinin yerine düşer: kişi, kalan süre ve Kabul/Reddet
 * doğrudan alt şeritte durur — panel açmadan davet yanıtlanır.
 */
export default function PkInlineInvite({ invite, more = 0, busy = false, onAccept, onDecline, onOpenProfile, onOpenAll }) {
  if (!invite) return null;
  const expired = Date.now() - new Date(invite.invited_at || invite.created_date || 0).getTime() > PK_INVITE_TTL_MS;
  const name = invite.host_name || 'Kullanıcı';

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-emerald-400/45 bg-emerald-500/10 px-2 py-1.5">
      <button
        type="button"
        onClick={() => onOpenProfile?.(invite.host_id)}
        className="flex min-w-0 flex-1 items-center gap-1.5 text-left active:scale-[0.99]"
      >
        {invite.host_avatar
          ? <img src={invite.host_avatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover ring-2 ring-emerald-400/50" />
          : <span className="h-7 w-7 shrink-0 rounded-full bg-white/15" />}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11.5px] font-black text-white">{name}</span>
          <span className={`flex items-center gap-1 text-[9.5px] font-semibold ${expired ? 'text-amber-300' : 'text-emerald-200/90'}`}>
            <Clock3 className="h-2.5 w-2.5" />
            {expired ? 'Süresi doldu' : 'PK daveti'}
            {more > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => { event.stopPropagation(); onOpenAll?.(); }}
                className="ml-0.5 rounded-full bg-white/15 px-1.5 font-black text-white"
              >
                +{more}
              </span>
            )}
          </span>
        </span>
      </button>
      <button
        type="button"
        disabled={busy || expired}
        onClick={() => onAccept?.(invite)}
        aria-label="Kabul et"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-black active:scale-95 disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => onDecline?.(invite)}
        aria-label="Reddet"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/12 text-white/80 active:scale-95 disabled:opacity-40"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}