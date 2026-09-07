import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

export default function VoiceControls() {
  const [muted, setMuted] = useState(true);
  const [deafened, setDeafened] = useState(false);

  const toggleMute = () => {
    setMuted((m) => !m);
  };

  const toggleDeafen = () => {
    setDeafened((d) => !d);
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <button onClick={toggleMute} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${muted ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-green-600/20 text-green-400 border border-green-500/30'}`}>
        {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        {muted ? 'Sessiz' : 'Konuş'}
      </button>
      <button onClick={toggleDeafen} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${deafened ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-muted-foreground border border-border'}`}>
        {deafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        {deafened ? 'Sağırlaştır' : 'Dinle'}
      </button>
    </div>
  );
}