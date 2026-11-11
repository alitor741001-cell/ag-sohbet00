import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, UserPlus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useFriends from '@/hooks/useFriends';
import { useToast } from '@/components/ui/use-toast';

const PersonRow = ({ person, busy, presence, onPick, onOpenProfile }) => {
  const fighting = presence?.state === 'busy';
  const seeking = presence?.state === 'seeking';
  return (
    <div className="flex w-full items-center gap-2 rounded-xl px-2 py-2">
      {/* Sol taraf profile gider: sesli odadaki profil kartı açılır. */}
      <button
        type="button"
        onClick={() => onOpenProfile?.(person.user_id)}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left active:scale-[0.99]"
      >
        {person.avatar
          ? <img src={person.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/20" />
          : <span className="h-9 w-9 shrink-0 rounded-full bg-white/15" />}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-bold text-white">{person.name || 'Kullanıcı'}</span>
          <span className={`block truncate text-[10px] font-semibold ${fighting ? 'text-rose-300' : seeking ? 'text-emerald-300' : 'text-white/45'}`}>
            {fighting ? `${presence.rival || 'Bir kullanıcı'} ile PK'da` : seeking ? 'PK atmak istiyor' : 'Profili gör · PK daveti gönder'}
          </span>
        </span>
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => onPick?.(person)}
        className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black active:scale-95 disabled:opacity-50 ${fighting ? 'bg-white/12 text-white/70' : 'bg-fuchsia-500 text-white'}`}
      >
        <UserPlus className="h-3 w-3" /> {fighting ? "PK'da" : 'Davet'}
      </button>
    </div>
  );
};

/** PK davet et: arkadaş listesi ve üye numarasıyla arama. Davet gönderilince sayfa değişmez. */
export default function PkInviteSheet({ open, onClose, user, onInvite, busy }) {
  const { relations } = useFriends();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const [liveRows, setLiveRows] = useState([]);

  const friends = useMemo(() => relations
    .filter((relation) => relation.status === 'accepted')
    .map((relation) => {
      const mine = relation.requester_id === user?.id;
      return mine
        ? { user_id: relation.recipient_id, name: relation.recipient_name, avatar: relation.recipient_avatar }
        : { user_id: relation.requester_id, name: relation.requester_name, avatar: relation.requester_avatar };
    })
    .filter((person) => person.user_id && person.user_id !== user?.id), [relations, user?.id]);

  // Açık görüntülü PK kayıtları canlı izlenir: kim PK'da, kim rakip arıyor.
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const load = async () => {
      const page = await base44.entities.PkMatch.filter(
        { mode: 'video', status: { $in: ['invite', 'live'] } },
        { sort: '-created_date', limit: 60 },
      ).catch(() => null);
      if (!cancelled) setLiveRows(page?.items || []);
    };
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') load();
    }, 6000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [open]);

  // Kişi başına durum: eşleşmişse PK'da, rakipsiz yayın açtıysa PK atmak istiyor.
  const pkStates = useMemo(() => {
    const map = new Map();
    liveRows.forEach((row) => {
      if (!row || row.status === 'ended') return;
      const fighting = !!row.guest_id && (row.accepted || row.status === 'live');
      if (fighting) {
        if (row.host_id) map.set(row.host_id, { state: 'busy', rival: row.guest_name || '' });
        if (row.guest_id) map.set(row.guest_id, { state: 'busy', rival: row.host_name || '' });
        return;
      }
      if (row.host_id && !row.guest_id) map.set(row.host_id, { state: 'seeking', rival: '' });
    });
    return map;
  }, [liveRows]);

  // PK atmak isteyenler listenin başında durur, PK'da olanlar sonda.
  const orderedFriends = useMemo(() => {
    const rank = (person) => {
      const state = pkStates.get(person.user_id)?.state;
      return state === 'seeking' ? 0 : state === 'busy' ? 2 : 1;
    };
    return [...friends].sort((a, b) => rank(a) - rank(b));
  }, [friends, pkStates]);

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

  // PK'da olan kişiye davet gönderilmez: neden gönderilemediği doğrudan söylenir.
  const pick = (person) => {
    const state = pkStates.get(person.user_id);
    if (state?.state === 'busy') {
      toast({
        title: `${person.name || 'Bu kişi'} şu an PK'da`,
        description: `${state.rival || 'Rakibi'} ile görüntülü PK'da. Tur bitince davet gönderebilirsin.`,
        variant: 'destructive',
      });
      return;
    }
    onInvite?.(person);
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
              <PersonRow person={found} busy={busy} presence={pkStates.get(found.user_id)} onPick={pick} />
            </div>
          )}
          {orderedFriends.length === 0 ? (
            <p className="py-6 text-center text-[11.5px] text-white/50">
              Henüz arkadaşın yok. Üye numarasıyla da davet gönderebilirsin.
            </p>
          ) : (
            <div className="space-y-0.5">
              {orderedFriends.map((person) => (
                <PersonRow
                  key={person.user_id}
                  person={person}
                  busy={busy}
                  presence={pkStates.get(person.user_id)}
                  onPick={pick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}