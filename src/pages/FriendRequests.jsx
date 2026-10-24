import { useEffect } from 'react';
import { ArrowLeft, Hand } from 'lucide-react';
import { markSeen } from '@/lib/seenBadge';
import { useNavigate } from 'react-router-dom';
import RoomFriendRequests from '@/components/friends/RoomFriendRequests';
import useFriends from '@/hooks/useFriends';
import PullToRefresh from '@/components/home/PullToRefresh';
import EmptyState from '@/components/movie/EmptyState';

/** Arkadaşlık istekleri: özel sohbet üst görselindeki istek alanı bu tam ekran sayfayı açar. */
export default function FriendRequests({ onBack, embedded = false }) {
  const navigate = useNavigate();
  const { user, relations, invoke, reload } = useFriends();
  const goBack = onBack || (() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/arkadaslar?view=chats', { replace: true })));
  useEffect(() => { markSeen('requests', user?.id); }, [user?.id, relations.length]);
  const incoming = relations.filter((relation) => relation.status === 'pending' && relation.recipient_id === user?.id);

  return (
    <div className={embedded ? 'dark w-full text-white' : 'dark min-h-[var(--app-height)] w-full text-white'} style={embedded ? undefined : { background: '#0a0a0d' }}>
      {/* Üst başlık ve geri düğmesi sabittir: kaydırma ve aşağı çekme sırasında yerinden oynamaz. */}
      {!embedded && <header className="fixed inset-x-0 top-0 z-30 flex items-center gap-2 border-b border-[#F2CE6B]/25 bg-[#0a0a0d] px-3 pb-2.5" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.6rem)' }}>
        <button type="button" onClick={goBack} aria-label="Geri" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#F2CE6B]/30 bg-white/5 text-[#ffeec2] active:scale-95">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="flex-1 text-center text-base font-black uppercase tracking-[0.18em] text-[#ffeec2]" style={{ textShadow: '0 0 6px rgba(255,214,120,0.9), 0 0 18px rgba(239,68,68,0.75)' }}>İstekler</h1>
        <span className="flex h-9 w-9 items-center justify-center text-sm font-black text-[#F2CE6B]">{incoming.length || ''}</span>
      </header>}

      <div style={embedded ? undefined : { paddingTop: 'calc(env(safe-area-inset-top) + 4.25rem)' }}>
        <PullToRefresh onRefresh={reload}>
          <div className="p-3">
            {incoming.length === 0 ? (
              <EmptyState icon={Hand} title="İstek yok" description="Bekleyen arkadaşlık isteğin bulunmuyor." />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#F2CE6B]/25 bg-white/5">
                <RoomFriendRequests relations={relations} userId={user?.id} invoke={invoke} />
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
}