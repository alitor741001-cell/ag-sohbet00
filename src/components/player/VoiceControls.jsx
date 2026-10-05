import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { NEON_TONES } from '@/lib/neonStyle';

const connectionLabels = {
  connected: '🟢 Bağlandı',
  reconnecting: '🟡 Yeniden bağlanıyor…',
  connecting: '🟡 Bağlanıyor…',
  disconnected: '🔴 Bağlantı kesildi',
};

// Referanstaki gibi kompakt, etiketli hap düğmeler: mikrofon kırmızı (#FF0033),
// hoparlör mavi (#007BFF).
const pillClass = (tone) => `flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full border bg-black/70 px-2 py-1 transition-transform active:scale-95 disabled:opacity-50 ${NEON_TONES[tone].card}`;

export default function VoiceControls({ voice }) {
  const speaking = voice.localSpeaking && voice.active && !voice.remoteMuted;
  const micLabel = voice.requesting ? 'HAZIRLANIYOR' : voice.remoteMuted ? 'YÖNETİCİ KAPATTI' : speaking ? 'KONUŞUYOR' : voice.active ? 'MİKROFONU KAPAT' : 'MİKROFONU AÇ';
  return <div className="room-voice-controls flex min-w-0 flex-1 flex-col gap-1">
    <div className="flex items-center gap-1.5">
      <button onClick={voice.toggleMute} disabled={voice.remoteMuted || voice.requesting || voice.connectionState !== 'connected' || voice.voiceEnabled === false} className={pillClass('red')}>
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 ${speaking ? 'speaking-glow' : ''}`}>{voice.active ? <Mic className="h-3 w-3 text-[#FF8AA0]" /> : <MicOff className="h-3 w-3 text-[#FF8AA0]" />}</span>
        <span className="min-w-0 truncate text-[9px] font-black text-white">{micLabel}</span>
      </button>
      <button onClick={voice.toggleDeafen} className={pillClass('blue')}>
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 ${voice.deafened ? 'text-[#7FBEFF]' : 'text-white'}`}>{voice.deafened ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}</span>
        <span className="min-w-0 truncate text-[9px] font-black text-white">{voice.deafened ? 'HOPARLÖR KAPALI' : 'HOPARLÖR AÇIK'}</span>
      </button>
    </div>
    {voice.connectionState !== 'connected' && <span className="text-center text-[8px] leading-tight text-[#A0A0A0]">{connectionLabels[voice.connectionState]}</span>}
    {voice.error && <button onClick={voice.audioBlocked ? voice.retryAudio : undefined} className="w-full rounded-lg border border-destructive/40 bg-black/95 p-2 text-left text-[10px] leading-relaxed text-destructive-foreground shadow-xl">{voice.error}</button>}
  </div>;
}