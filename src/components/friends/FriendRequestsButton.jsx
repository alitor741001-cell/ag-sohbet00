import { useState } from 'react';
import { Hand, X } from 'lucide-react';
import RoomFriendRequests from '@/components/friends/RoomFriendRequests';
import useBackDismiss from '@/hooks/useBackDismiss';

export default function FriendRequestsButton({ relations = [], userId, invoke }) {
  const [open, setOpen] = useState(false);
  const count = relations.filter((item) => item.status === 'pending' && item.recipient_id === userId).length;
  useBackDismiss(open, () => setOpen(false));
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Arkadaşlık istekleri" className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-fantasy-gold/40 bg-fantasy-gold/10 text-fantasy-gold active:scale-95">
        <Hand className="h-6 w-6" fill="currentColor" strokeWidth={1.5} />
        {count > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{count}</span>}
      </button>
      {open && <div className="fixed inset-0 z-[280] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Arkadaşlık istekleri">
        <button type="button" onClick={() => setOpen(false)} aria-label="Kapat" className="absolute inset-0 bg-background/80" />
        <section className="relative max-h-[70dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-fantasy-gold/30 bg-card pb-[max(1rem,env(safe-area-inset-bottom))] text-card-foreground">
          <div className="flex justify-end px-3 pt-3"><button type="button" onClick={() => setOpen(false)} aria-label="İstekleri kapat" className="rounded-full p-2"><X className="h-5 w-5" /></button></div>
          <RoomFriendRequests relations={relations} userId={userId} invoke={invoke} />
        </section>
      </div>}
    </>
  );
}