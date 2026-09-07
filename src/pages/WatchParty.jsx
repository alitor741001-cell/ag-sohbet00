import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import VideoPlayer from '@/components/player/VideoPlayer';
import ChatOverlay from '@/components/player/ChatOverlay';
import VoiceControls from '@/components/player/VoiceControls';
import RoomSettingsMenu from '@/components/player/RoomSettingsMenu';
import { Loader2, ArrowLeft, Users, Lock, Settings, Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function WatchParty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [room, setRoom] = useState(null);
  const [movie, setMovie] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await base44.entities.Conversation.get(id);
        if (!active) return;
        setRoom(r);
        if (r.movie_id) {
          try { setMovie(await base44.entities.Movie.get(r.movie_id)); } catch {}
        }
        const msgs = await base44.entities.ChatMessage.filter({ room_id: id });
        if (!active) return;
        setMessages((msgs || []).sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      } catch {}
      finally { if (active) setLoading(false); }
    })();
    const unsubMsg = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.room_id !== id) return;
      setMessages((prev) => {
        if (event.type === 'delete') return prev.filter((m) => m.id !== event.id);
        const filtered = prev.filter((m) => m.id !== event.id);
        return [...filtered, event.data].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      });
    });
    return () => { active = false; unsubMsg?.(); };
  }, [id]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    try {
      await base44.entities.ChatMessage.create({ room_id: id, user_id: user.id, user_name: user.full_name || user.username, content: input, type: 'text' });
      setInput('');
    } catch (err) { toast({ title: 'Hata', description: err.message, variant: 'destructive' }); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
  if (!room) return <div className="flex flex-col items-center justify-center min-h-screen"><p className="text-muted-foreground mb-4">Oda bulunamadı</p><button onClick={() => navigate('/acik-odalar')} className="text-purple-400">Açık odalar</button></div>;

  return (
    <div className="min-h-screen pt-16 flex flex-col lg:flex-row">
      <div className="flex-1 p-2 lg:p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white mb-2"><ArrowLeft className="w-4 h-4" /> Geri</button>
        <div className="aspect-video rounded-xl overflow-hidden bg-black">
          <VideoPlayer ref={videoRef} src={movie?.video_url} poster={movie?.backdrop_url} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">{movie?.title || 'Oda'}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" /> {participants.length} izleyici
              {room.is_private && <span className="flex items-center gap-1 text-amber-400"><Lock className="w-3 h-3" /> Gizli</span>}
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><Settings className="w-4 h-4 text-white" /></button>
        </div>
        <VoiceControls />
      </div>
      <div className="lg:w-80 p-2 lg:p-4 lg:border-l border-border flex flex-col h-[50vh] lg:h-auto">
        <h3 className="font-semibold text-white mb-2">Sohbet</h3>
        <div className="flex-1 overflow-y-auto space-y-2 mb-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-1.5 ${m.user_id === user?.id ? 'bg-purple-600 text-white' : 'bg-white/10 text-white'}`}>
                {m.user_id !== user?.id && <p className="text-xs font-semibold text-purple-300">{m.user_name}</p>}
                <p className="text-sm">{m.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Mesaj..." className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-white" />
          <button onClick={sendMessage} className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center hover:bg-purple-700"><Send className="w-4 h-4 text-white" /></button>
        </div>
      </div>
      {showSettings && <RoomSettingsMenu room={room} onClose={() => setShowSettings(false)} />}
    </div>
  );
}