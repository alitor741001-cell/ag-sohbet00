import { ArrowLeft, Hand } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoomFriendRequests from '@/components/friends/RoomFriendRequests';
import useFriends from '@/hooks/useFriends';
import PullToRefresh from '@/components/home/PullToRefresh';
import EmptyState from '@/components/movie/EmptyState';

/** Arkadaşlık istekleri: özel sohbet üst görselindeki istek alanı bu tam ekran sayfayı açar. */
export default function FriendRequests() {
  const navigate = useNavigate();
  const { user, relations, invoke, reload } = useFriends();
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/arkadaslar?view=chats', { replace: true }));
  const incoming = relations.filter((relation) => relation.status === 'pending' && relation.recipient_id === user?.id);

  return (
    <div className="dark mx-auto min-h-[calc(100vh-8rem)] w-full min-w-0 max-w-5xl bg-background text-white supports-[height:100dvh]:min-h-[calc(100dvh-8rem)]">
      <PullToRefresh onRefresh={reload}>
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[#F2CE6B]/25 px-3 py-2.5" style={{ background: 'rgba(9,7,13,0.94)' }}>
          <button type="button" onClick={goBack} aria-label="Geri" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#F2CE6B]/30 bg-white/5 text-[#ffeec2] active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="flex-1 text-center text-base font-black uppercase tracking-[0.18em] text-[#ffeec2]" style={{ textShadow: '0 0 6px rgba(255,214,120,0.9), 0 0 18px rgba(239,68,68,0.75)' }}>İstekler</h1>
          <span className="flex h-9 w-9 items-center justify-center text-sm font-black text-[#F2CE6B]">{incoming.length || ''}</span>
        </header>

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
  );
}