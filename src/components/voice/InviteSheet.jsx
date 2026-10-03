import { useMemo, useState } from 'react';
import { Check, Send } from 'lucide-react';
import { Image } from '@/components/ui/image';
import useFriends from '@/hooks/useFriends';
import VoiceSheet from '@/components/voice/VoiceSheet';

/** Odadaki kişiler arkadaşlarını odaya davet edebilir. */
export default function InviteSheet({ open, onClose, onInvite }) {
  const { user, relations, loading } = useFriends();
  const [selected, setSelected] = useState([]);

  const friends = useMemo(() => {
    return relations
      .filter((relation) => relation.status === 'accepted')
      .map((relation) => {
        const mine = relation.requester_id === user?.id;
        return {
          id: mine ? relation.recipient_id : relation.requester_id,
          name: (mine ? relation.recipient_name : relation.requester_name) || 'Kullanıcı',
          avatar: mine ? relation.recipient_avatar : relation.requester_avatar,
        };
      })
      .filter((friend) => friend.id && friend.id !== user?.id);
  }, [relations, user?.id]);

  const toggle = (id) => setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const submit = async () => {
    if (!selected.length) return;
    const sent = await onInvite(selected);
    if (sent) setSelected([]);
  };

  return (
    <VoiceSheet open={open} onClose={onClose} title="Arkadaşını davet et">
      {loading ? (
        <p className="py-8 text-center text-xs text-white/50">Yükleniyor...</p>
      ) : friends.length === 0 ? (
        <p className="py-8 text-center text-xs text-white/50">Davet edebileceğin arkadaş yok.</p>
      ) : (
        <div className="max-h-[45vh] space-y-2 overflow-y-auto">
          {friends.map((friend) => {
            const active = selected.includes(friend.id);
            return (
              <button
                key={friend.id}
                type="button"
                onClick={() => toggle(friend.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left active:scale-[0.98] transition-transform ${active ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-[#171720]'}`}
              >
                {friend.avatar
                  ? <Image src={friend.avatar} alt={friend.name} className="h-10 w-10 shrink-0 rounded-full overflow-hidden" fittingType="fill" />
                  : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">{friend.name[0]}</span>}
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{friend.name}</span>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${active ? 'bg-green-500' : 'border border-white/25'}`}>
                  {active && <Check className="h-3 w-3 text-white" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <button
        type="button"
        disabled={!selected.length}
        onClick={submit}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40"
      >
        <Send className="h-4 w-4" /> Davet et {selected.length > 0 && `(${selected.length})`}
      </button>
    </VoiceSheet>
  );
}