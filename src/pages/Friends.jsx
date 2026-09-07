import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import FriendsPanel from '@/components/friends/FriendsPanel';
import ChatPanel from '@/components/friends/ChatPanel';
import ConversationList from '@/components/friends/ConversationList';
import { Loader2, MessageSquare, Users } from 'lucide-react';

export default function Friends() {
  const { user, loading } = useCurrentUser();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [view, setView] = useState('friends');

  useEffect(() => {
    if (!user) return;
    base44.entities.Friendship.filter({ user_id: user.id, status: 'accepted' }).then(async (items) => {
      const enriched = await Promise.all((items || []).map(async (f) => {
        try { return { ...f, friend: await base44.entities.User.get(f.friend_id) }; } catch (err) { return f; }
      }));
      setFriends(enriched);
    }).catch(() => {});
    base44.entities.Friendship.filter({ friend_id: user.id, status: 'pending' }).then(async (items) => {
      const enriched = await Promise.all((items || []).map(async (f) => {
        try { return { ...f, requester: await base44.entities.User.get(f.user_id) }; } catch (err) { return f; }
      }));
      setRequests(enriched);
    }).catch(() => {});
    base44.entities.Conversation.filter({ participants: user.id }).then(setConversations).catch(() => {});
  }, [user?.id]);

  if (loading || !user) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Arkadaşlar</h1>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setView('friends')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${view === 'friends' ? 'bg-purple-600 text-white' : 'bg-white/5 text-muted-foreground'}`}>
          <Users className="w-4 h-4" /> Arkadaşlar ({friends.length})
        </button>
        <button onClick={() => setView('messages')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${view === 'messages' ? 'bg-purple-600 text-white' : 'bg-white/5 text-muted-foreground'}`}>
          <MessageSquare className="w-4 h-4" /> Mesajlar
        </button>
      </div>
      {view === 'friends' ? (
        <FriendsPanel friends={friends} requests={requests} user={user} />
      ) : (
        <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-200px)]">
          <ConversationList conversations={conversations} activeConv={activeConv} setActiveConv={setActiveConv} user={user} />
          <ChatPanel conversation={activeConv} user={user} />
        </div>
      )}
    </div>
  );
}