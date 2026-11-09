import { Check, Clock3, Loader2, X } from 'lucide-react';
import { PK_INVITE_TTL_MS } from '@/hooks/useVideoPk';

/** Gelen PK davetleri: gönderen kişi, durum ve kabul/ret. Sayfadan çıkılmaz. */
export default function PkInboxSheet({ open, onClose, invites = [], onAccept, onDecline, busy, onOpenProfile }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col justify-end">
      <button type="button" aria-label="Kapat" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="animate-sheet-up relative flex max-h-[70vh] flex-col overflow-hidden rounded-t-[26px] bg-[#170d20] ring-1 ring-fuchsia-400/25">
        <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
          <p className="text-[13px] font-black text-white">PK Davet Onayı</p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 text-white/60 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {invites.length === 0 ? (
            <p className="py-6 text-center text-[11.5px] text-white/50">Şu an gelen PK daveti yok.</p>
          ) : invites.map((invite) => {
            const expired = Date.now() - new Date(invite.created_date || 0).getTime() > PK_INVITE_TTL_MS;
            return (
              <div key={invite.id} className="mb-1.5 rounded-2xl bg-white/[0.06] p-2.5 ring-1 ring-white/10">
                {/* Davet eden kişiye dokununca sesli odadaki profil kartı açılır. */}
                <button
                  type="button"
                  onClick={() => onOpenProfile?.(invite.host_id)}
                  className="flex w-full items-center gap-2 text-left active:scale-[0.99]"
                >
                  {invite.host_avatar
                    ? <img src={invite.host_avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-fuchsia-400/50" />
                    : <span className="h-10 w-10 shrink-0 rounded-full bg-white/15" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-black text-white">{invite.host_name || 'Kullanıcı'}</p>
                    <p className={`flex items-center gap-1 text-[10.5px] font-semibold ${expired ? 'text-amber-300' : 'text-white/55'}`}>
                      <Clock3 className="h-3 w-3" />
                      {expired ? 'Davetin süresi doldu' : 'Görüntülü PK daveti gönderdi'}
                    </p>
                  </div>
                </button>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    disabled={busy || expired}
                    onClick={() => onAccept?.(invite)}
                    className="flex h-9 flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-500 text-[11.5px] font-black text-black active:scale-95 disabled:opacity-40"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Kabul Et
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDecline?.(invite)}
                    className="flex h-9 flex-1 items-center justify-center gap-1 rounded-xl bg-white/10 text-[11.5px] font-black text-white/80 active:scale-95 disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5" /> Reddet
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}