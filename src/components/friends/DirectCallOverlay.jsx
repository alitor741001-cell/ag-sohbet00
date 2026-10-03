import { ArrowLeft, Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CallBubble from '@/components/friends/CallBubble';
import { useDirectCall } from '@/lib/DirectCallContext';
import XpAvatar from '@/components/xp/XpAvatar';
import ProfileFrame from '@/components/ProfileFrame';
import CallCircleButton from '@/components/friends/CallCircleButton';

const formatDuration = (total) => {
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};

export default function DirectCallOverlay() {
  const navigate = useNavigate();
  const { call, role, phase, seconds, muted, speaker, error, minimized, remoteMuted, minimizeCall, restoreCall, acceptCall, rejectCall, endCall, toggleMute, toggleSpeaker } = useDirectCall();
  if (!call || phase === 'idle') return null;

  const other = role === 'callee'
    ? { id: call.caller_id, name: call.caller_name, avatar: call.caller_avatar, frame: call.caller_frame, frameScale: call.caller_frame_scale }
    : { id: call.callee_id, name: call.callee_name, avatar: call.callee_avatar, frame: call.callee_frame, frameScale: call.callee_frame_scale };

  const statusText = phase === 'active'
    ? formatDuration(seconds)
    : phase === 'incoming'
      ? 'Sesli arama isteği'
      : 'Bağlanıyor...';

  if (minimized && phase !== 'incoming') return <CallBubble avatar={other.avatar} name={other.name} muted={remoteMuted} onOpen={restoreCall} />;

  return (
    <section className="fixed inset-0 z-[230] flex flex-col bg-catalog text-primary-foreground" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-primary/25 to-transparent" />
      {phase !== 'incoming' && <button type="button" aria-label="Aramayı küçült ve ana ekrana dön" onClick={() => { minimizeCall(); navigate('/'); }} className="absolute left-4 z-10 rounded-full bg-secondary p-3 text-secondary-foreground" style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}><ArrowLeft className="h-6 w-6" /></button>}
      <p className="relative pt-10 text-center text-[11px] uppercase tracking-[0.35em] text-white/50">
        {phase === 'incoming' ? 'Gelen arama' : phase === 'outgoing' ? 'Aranıyor' : 'Sesli arama'}
      </p>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-5 px-6">
        <div className="relative">
          {phase !== 'active' && <span className={`absolute inset-0 rounded-full animate-ping ${phase === 'incoming' ? 'bg-green-500/25' : 'bg-white/15'}`} />}
          {other.frame
            ? <ProfileFrame frame={other.frame} avatar={other.avatar} name={other.name} size="lg" frameScale={other.frameScale} />
            : <XpAvatar avatar={other.avatar} name={other.name} size="lg" />}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">{other.name || 'Kullanıcı'}</h2>
          <p className={`mt-1 text-sm ${phase === 'active' ? 'font-mono tracking-widest text-white/80' : 'text-white/60'}`}>{statusText}</p>
          {remoteMuted && phase === 'active' && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
              <MicOff className="h-3.5 w-3.5" /> {other.name || 'Karşı taraf'} sessize alındı
            </p>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <div className="relative flex shrink-0 items-center justify-center gap-9 pb-12">
        {phase === 'incoming' ? (
          <>
            <CallCircleButton tone="red" onClick={rejectCall} label="Reddet"><PhoneOff className="h-7 w-7" /></CallCircleButton>
            <CallCircleButton tone="green" onClick={acceptCall} label="Kabul et" pulsing><Phone className="h-7 w-7" /></CallCircleButton>
          </>
        ) : (
          <>
            <CallCircleButton tone="gray" onClick={toggleMute} label={muted ? 'Sesi aç' : 'Sessiz'}>
              {muted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
            </CallCircleButton>
            <CallCircleButton tone="gray" onClick={toggleSpeaker} label={speaker ? 'Sesi kapat' : 'Sesi aç'}>
              {speaker ? <Volume2 className="h-7 w-7" /> : <VolumeX className="h-7 w-7" />}
            </CallCircleButton>
            <CallCircleButton tone="red" onClick={endCall} label="Kapat"><PhoneOff className="h-7 w-7" /></CallCircleButton>
          </>
        )}
      </div>
    </section>
  );
}