import { useEffect, useState } from 'react';
import useDraggableBubble from '@/hooks/useDraggableBubble';
import MusicControllerBubble from '@/components/voice/MusicControllerBubble';
import MusicControllerCard from '@/components/voice/MusicControllerCard';

/**
 * Oda müziği denetleyicisi: pencere kapandığında köşede çember olarak kalır,
 * dokununca panel açılır; yuvarlak kapatma tuşu hem paneli hem müziği kapatır.
 */
export default function MusicController({ title, playing, volume, onVolume, isMod, onToggle, onNext, onOpenList, onStop }) {
  const [open, setOpen] = useState(false);
  const [stopped, setStopped] = useState(false);
  const { pos, bind, didDrag } = useDraggableBubble('filmykeyfi:musicBubble');

  // Müzik yeniden başladığında denetleyici kendiliğinden geri gelir.
  useEffect(() => { if (playing) setStopped(false); }, [playing]);

  // Müziği durdurmak denetleyiciyi de kapatır.
  const stopMusic = () => {
    setOpen(false);
    setStopped(true);
    onStop?.();
  };

  if (stopped) return null;

  if (open) {
    return (
      <MusicControllerCard
        title={title}
        playing={playing}
        volume={volume}
        onVolume={onVolume}
        isMod={isMod}
        onToggle={onToggle}
        onNext={onNext}
        onOpenList={onOpenList}
        onStop={stopMusic}
        // Yuvarlak kapatma: panel kapanır, yöneticilerde müzik de durur.
        onCollapse={() => { if (isMod) stopMusic(); else setOpen(false); }}
      />
    );
  }

  return <MusicControllerBubble pos={pos} playing={playing} bind={bind} didDrag={didDrag} onOpen={() => setOpen(true)} />;
}