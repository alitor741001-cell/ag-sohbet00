import useSocialList from '@/hooks/useSocialList';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, HeartHandshake, Loader2, UserCheck } from 'lucide-react';
import useActiveRooms from '@/hooks/useActiveRooms';
import { findLiveRoom } from '@/lib/liveRoom';
import SocialPersonRow from '@/components/profile/social/SocialPersonRow';

/** Ziyaret zamanı: 22.10.2026 · 02:14 */
const formatVisit = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const TITLES = {
  friends: { label: 'Arkadaşlarım', Icon: UserCheck },
  following: { label: 'Takip Edilenler', Icon: UserCheck },
  followers: { label: 'Takipçiler', Icon: HeartHandshake },
  visitors: { label: 'Ziyaretçiler', Icon: Eye },
};

/** Takip ve ziyaretçi listeleri: tam ekran açılır, geri butonuyla profile dönülür. */
export default function SocialListDialog({ open, kind, onClose }) {
  const { items, loading, error, hasMore, loadMore, retry } = useSocialList(open, kind);
  const navigate = useNavigate();
  const { rooms, getRoomId } = useActiveRooms(open);
  const meta = TITLES[kind] || TITLES.visitors;

  if (!open) return null;

  return (
    <div
      className="dark fixed inset-0 z-[300] flex flex-col text-white"
      style={{ background: 'radial-gradient(120% 80% at 50% 0%, #3a1146 0%, #1b0a2a 46%, #0a0410 100%)' }}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-[#f2ce6b]/25 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => onClose?.()}
          aria-label="Geri"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/40 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <p className="flex min-w-0 flex-1 items-center justify-center gap-2 text-sm font-extrabold text-[#f2ce6b]">
          <meta.Icon className="h-4 w-4 shrink-0" /> {meta.label}
        </p>
        <span className="h-9 w-9 shrink-0" />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {error && <p role="alert" className="mb-4 text-center text-sm text-destructive">{error}<button type="button" onClick={retry} className="ml-2 underline">Yeniden dene</button></p>}
        {loading && items.length === 0 ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#f2ce6b]" /></div>
        ) : items.length === 0 ? (
          !error && <p className="py-12 text-center text-sm font-semibold text-white/50">Henüz kimse yok.</p>
        ) : (
          <div className="mx-auto w-full max-w-[430px] space-y-1.5">
            {items.map((person) => (
              <SocialPersonRow
                key={person.id}
                person={person}
                visitTime={kind === 'visitors' ? formatVisit(person.visited_at) : ''}
                liveRoom={findLiveRoom(rooms, person.id, getRoomId(person.id))}
                onOpen={() => { onClose?.(); navigate(`/kullanici/${person.id}`); }}
                onJoin={() => onClose?.()}
              />
            ))}
            {hasMore && <button type="button" disabled={loading} onClick={loadMore} className="min-h-11 w-full rounded-xl border border-border bg-secondary py-2 text-sm text-secondary-foreground disabled:opacity-50">{loading ? 'Yükleniyor...' : 'Daha fazla göster'}</button>}
          </div>
        )}
      </div>
    </div>
  );
}