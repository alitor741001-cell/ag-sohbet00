import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { NEON_TONES } from '@/lib/neonStyle';

const connectionLabels = {
  connected: '🟢 Bağlandı',
  reconnecting: '🟡 Yeniden bağlanıyor…',
  connecting: '🟡 Bağlanıyor…',
  disconnected: '🔴 Bağlantı kesildi',
};

// Referanstaki gibi etiketli, parlayan hap düğmeler: mikrofon kırmızı (#FF0033),
// hoparlör mavi (#007BFF).
const pillClass = (tone) => `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl border bg-black/70 px-1.5 py-1.5 text-center transition-transform active:scale-95 disabled:opacity-50 ${NEON_TONES[tone].card}`;

export default function VoiceControls({ voice }) {
  const speaking = voice.localSpeaking && voice.active && !voice.remoteMuted;
  const micLabel = voice.requesting ? 'HAZIRLANIYOR' : voice.remoteMuted ? 'YÖNETİCİ KAPATTI' : speaking ? 'KONUŞUYOR' : voice.active ? 'MİKROFONU KAPAT' : 'MİKROFONU AÇ';
  return <div className="room-voice-controls flex min-w-0 flex-1 flex-col gap-1">
    <div className="flex items-stretch gap-1.5">
      <button onClick={voice.toggleMute} disabled={voice.remoteMuted || voice.requesting || voice.connectionState !== 'connected' || voice.voiceEnabled === false} className={pillClass('red')}>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-white/10 ${speaking ? 'speaking-glow' : ''}`}>{voice.active ? <Mic className="h-4 w-4 text-[#FF8AA0]" /> : <MicOff className="h-4 w-4 text-[#FF8AA0]" />}</span>
        <span className="max-w-full text-[9px] font-black leading-tight text-white">{micLabel}</span>
        <span className="text-[8px] leading-tight text-[#A0A0A0]">{connectionLabels[voice.connectionState]}</span>
      </button>
      <button onClick={voice.toggleDeafen} className={pillClass('blue')}>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-white/10 ${voice.deafened ? 'text-[#7FBEFF]' : 'text-white'}`}>{voice.deafened ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</span>
        <span className="text-[9px] font-black leading-tight text-white">{voice.deafened ? 'HOPARLÖR KAPALI' : 'HOPARLÖR AÇIK'}</span>
      </button>
    </div>
    {voice.error && <button onClick={voice.audioBlocked ? voice.retryAudio : undefined} className="w-full rounded-lg border border-destructive/40 bg-black/95 p-2 text-left text-[10px] leading-relaxed text-destructive-foreground shadow-xl">{voice.error}</button>}
  </div>;
}