import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import useLatestCallback from '@/hooks/useLatestCallback';

export default function useVoiceMicControls({ voice, seated, seats, seatIndex, setSeatIndex, invokeVoice, room, setRoom, id, toast }) {
  const busy = useRef(false), scope = useRef(null);
  useEffect(() => { const current = {}; scope.current = current; return () => { if (scope.current === current) scope.current = null; }; }, [id]);
  const takeSeat = async (index) => {
    const current = scope.current;
    const track = voice.canSpeak !== false ? await voice.prepareMic() : null;
    if (!current || scope.current !== current) { track?.stop(); return; }
    const taken = await invokeVoice({ action: 'seat-take', seat_index: index });
    if (taken && voice.canSpeak !== false) voice.requestMic();
  };
  const run = async (action) => {
    if (busy.current) return;
    busy.current = true;
    try { await action(); }
    catch (error) { toast({ title: 'Mikrofon açılamadı', description: error.response?.data?.error || error.message, variant: 'destructive' }); }
    finally { busy.current = false; }
  };
  const handleMic = useLatestCallback(() => run(async () => {
    void voice.retryAudio();
    if (voice.canSpeak === false) { voice.requestMic(); return; }
    if (!seated) {
      const free = seats.find((seat) => !seat.user_id && !seat.locked);
      if (!free) { toast({ title: 'Boş koltuk yok', description: 'Mikrofonu açmak için boş bir koltuk gerekiyor.' }); return; }
      setSeatIndex(null);
      await takeSeat(free.index);
    } else if (room?.voice_enabled) await voice.toggleMute();
    else {
      await voice.prepareMic();
      await base44.functions.invoke('room-presence', { action: 'enable-voice', room_id: id });
      setRoom((previous) => previous ? { ...previous, voice_enabled: true } : previous);
    }
  }));
  const handleTakeSeat = useLatestCallback(() => run(async () => {
    const index = seatIndex;
    setSeatIndex(null);
    if (index !== null) await takeSeat(index);
  }));
  const muteMicFromSeat = useLatestCallback(() => {
    const index = seatIndex;
    setSeatIndex(null);
    if (index !== null) void invokeVoice({ action: 'seat-mute', seat_index: index, muted: !seats[index]?.muted });
  });
  return { handleMic, handleTakeSeat, muteMicFromSeat };
}