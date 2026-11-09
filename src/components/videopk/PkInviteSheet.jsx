import { useMemo, useState } from 'react';
import { Loader2, Search, UserPlus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useFriends from '@/hooks/useFriends';

const PersonRow = ({ person, busy, onPick }) => (
  <button
    type="button"
    disabled={busy}
    onClick={() => onPick?.(person)}
    className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left active:scale-[0.99] disabled:opacity-50"
  >
    {person.avatar
      ? <img src={person.avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-white/20" />
      : <span className="h-9 w-9 rounded-full bg-white/15" />}
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[12.5px] font-bold text-white">{person.name || 'Kullanıcı'}</span>
      <span className="block truncate text-[10px] font-semibold text-white/45">Görüntülü PK daveti gönder</span>
    </span>
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-fuchsia-500 px-2.5 py-1 text-[10px] font-black text-white">
      <UserPlus className="h-3 w-3" /> Davet
    </span>
  </button>
);

/** PK davet et: arkadaş listesi ve üye numarasıyla arama. Davet gönderilince sayfa değişmez. */
export default function PkInviteSheet({ open, onClose, user, onInvite, busy }) {
  const { relations } = useFriends();
  const [query, setQuery] = useState('');
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);

  const friends = useMemo(() => relations
    .filter((relation) => relation.status === 'accepted')
    .map((relation) => {
      const mine = relation.requester_id === user?.id;
      return mine
        ? { user_id: relation.recipient_id, name: relation.recipient_name, avatar: relation.recipient_avatar }
        : { user_id: relation.requester_id, name: relation.requester_name, avatar: relation.requester_avatar };
    })
    .filter((person) => person.user_id && person.user_id !== user?.id), [relations, user?.id]);

  const search = async () => {
    const value = String(query || '').replace(/\D/g, '');
    if (value.length < 6) return;
    setSearching(true);
    try {
      const response = await base44.functions.invoke('friend-service', { action: 'search', member_id: value });
      const person = response.data?.user;
      setFound(person ? { user_id: person.id, name: person.full_name, avatar: person.avatar } : null);
    } catch (error) {
      setFound(null);
    } finally {
      setSearching(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col justify-end">
      <button type="button" aria-label="Kapat" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="animate-sheet-up relative flex h-[72vh] flex-col overflow-hidden rounded-t-[26px] bg-[#170d20] ring-1 ring-fuchsia-400/25">
        <div className="flex shrink-0 items-center justify-between px-4 pb-1 pt-4">
          <p className="text-[13px] font-black text-white">PK Davet Et</p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 text-white/60 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 px-3 pb-2 pt-1">
          <div className="flex h-9 flex-1 items-center gap-1.5 rounded-xl bg-white/8 px-2 ring-1 ring-white/12">
            <Search className="h-3.5 w-3.5 shrink-0 text-white/40" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') search(); }}
              inputMode="numeric"
              placeholder="Üye numarasıyla ara"
              className="min-w-0 flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-white/35"
            />
          </div>
          <button
            type="button"
            onClick={search}
            disabled={searching}
            className="flex h-9 items-center gap-1 rounded-xl bg-white/12 px-3 text-[11px] font-black text-white active:scale-95 disabled:opacity-50"
          >
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Ara'}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {found && (
            <div className="mb-1 rounded-xl bg-white/[0.05]">
              <PersonRow person={found} busy={busy} onPick={onInvite} />
            </div>
          )}
          {friends.length === 0 ? (
            <p className="py-6 text-center text-[11.5px] text-white/50">
              Henüz arkadaşın yok. Üye numarasıyla da davet gönderebilirsin.
            </p>
          ) : (
            <div className="space-y-0.5">
              {friends.map((person) => (
                <PersonRow key={person.user_id} person={person} busy={busy} onPick={onInvite} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}