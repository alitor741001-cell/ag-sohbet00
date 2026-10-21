import { UserPlus } from 'lucide-react';
import CrystalCard from '@/components/profile/fantasy/CrystalCard';

/** Bekleyen arkadaşlık istekleri: kristal panel içinde kabul/reddet. */
export default function FriendRequests({ relations, userId, invoke }) {
  const incoming = relations.filter((r) => r.status === 'pending' && r.recipient_id === userId);
  const outgoing = relations.filter((r) => r.status === 'pending' && r.requester_id === userId);
  const respond = (id, accept) => invoke({ action: 'respond', friendship_id: id, accept }).catch(() => {});
  if (!incoming.length && !outgoing.length) return null;

  return (
    <CrystalCard>
      <div className="flex items-center gap-3 border-b border-[#7dd3fc]/20 px-4 py-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'rgba(56,189,248,0.14)', border: '1px solid rgba(125,211,252,0.35)' }}
        >
          <UserPlus className="h-4 w-4 text-[#a5e4ff]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-white">Arkadaşlık İstekleri</p>
          <p className="text-[10.5px] font-semibold text-[#a5e4ff]/60">{incoming.length} bekleyen istek</p>
        </div>
      </div>

      <div className="space-y-2 p-3">
        {incoming.map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded-xl border border-[#7dd3fc]/15 bg-[#0b2a52]/70 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-black text-white">{r.requester_name}</p>
              <p className="truncate text-[10.5px] font-semibold text-white/45">{r.requester_member_id}</p>
            </div>
            <button
              type="button"
              onClick={() => respond(r.id, true)}
              className="rounded-xl px-3 py-1.5 text-[11px] font-black text-[#052033] active:scale-95"
              style={{ background: 'linear-gradient(135deg,#d8fffb 0%,#6fe6dc 50%,#9ad7ff 100%)' }}
            >
              Kabul Et
            </button>
            <button
              type="button"
              onClick={() => respond(r.id, false)}
              className="rounded-xl border border-[#ff7b7b]/40 bg-[#3a1020]/70 px-3 py-1.5 text-[11px] font-bold text-[#ff9b9b] active:scale-95"
            >
              Reddet
            </button>
          </div>
        ))}
        {outgoing.map((r) => (
          <div key={r.id} className="rounded-xl border border-[#7dd3fc]/15 bg-[#0b2a52]/50 p-3">
            <p className="truncate text-[12.5px] font-black text-white">{r.recipient_name}</p>
            <p className="truncate text-[10.5px] font-semibold text-white/45">İstek bekliyor · {r.recipient_member_id}</p>
          </div>
        ))}
      </div>
    </CrystalCard>
  );
}