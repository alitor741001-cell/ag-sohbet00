import ProfileFrame from '@/components/ProfileFrame';
import { MessageSquare } from 'lucide-react';

export default function ConversationList({ conversations, activeConv, setActiveConv, user }) {
  if (conversations.length === 0) return <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">Sohbet yok</div>;

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden h-full">
      <div className="p-3 border-b border-border"><h3 className="font-semibold text-white text-sm">Sohbetler</h3></div>
      <div className="overflow-y-auto h-[calc(100%-49px)]">
        {conversations.map((c) => {
          const otherId = c.participants?.find((p) => p !== user.id);
          return (
            <button key={c.id} onClick={() => setActiveConv(c)} className={`w-full flex items-center gap-3 p-3 text-left border-b border-border/50 ${activeConv?.id === c.id ? 'bg-purple-500/10' : 'hover:bg-white/5'}`}>
              <ProfileFrame user={{ id: otherId }} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{c.title || 'Sohbet'}</p>
                <p className="text-xs text-muted-foreground truncate">{c.last_message || 'Mesaj yok'}</p>
              </div>
              {c.last_message_at && <span className="text-xs text-muted-foreground shrink-0">{new Date(c.last_message_at).toLocaleDateString('tr-TR')}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}