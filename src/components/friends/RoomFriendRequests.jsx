import { Check, X } from 'lucide-react';

/** Özel sohbet panelindeki arkadaşlık isteği bölümü: gelen istekler kabul edilir veya reddedilir. */
export default function RoomFriendRequests({ relations = [], userId, invoke }) {
  const incoming = relations.filter((relation) => relation.status === 'pending' && relation.recipient_id === userId);
  return (
    <div className="border-b border-[#F2CE6B]/25 p-3">
      <p className="mb-2 text-[11px] font-black tracking-[0.12em] text-[#F2CE6B]">ARKADAŞLIK İSTEĞİ</p>
      {incoming.length === 0 ? (
        <p className="text-xs text-white/50">Bekleyen arkadaşlık isteği yok.</p>
      ) : (
        <div className="space-y-2">
          {incoming.map((relation) => (
            <div key={relation.id} className="flex items-center gap-2 rounded-xl bg-white/5 p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{relation.requester_name}</p>
                <p className="truncate text-[11px] text-white/45">{relation.requester_member_id}</p>
              </div>
              <button
                type="button"
                aria-label="Kabul et"
                onClick={() => invoke({ action: 'respond', friendship_id: relation.id, accept: true }).catch(() => {})}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 active:scale-95"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Reddet"
                onClick={() => invoke({ action: 'respond', friendship_id: relation.id, accept: false }).catch(() => {})}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}