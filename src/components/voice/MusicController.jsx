import { useEffect, useState } from 'react';
import useDraggableBubble from '@/hooks/useDraggableBubble';
import MusicControllerBubble from '@/components/voice/MusicControllerBubble';
import MusicControllerCard from '@/components/voice/MusicControllerCard';

/**
 * Oda müziği denetleyicisi: pencere kapandığında köşede çember olarak kalır, dokununca panel
 * açılır; panel de üst şeridinden tutulup ekranda gezdirilir. Aşağı ok paneli çembere indirir,
 * müziği yalnızca yuvarlak güç tuşu durdurur.
 */
export default function MusicController({ title, playing, volume, onVolume, isMod, onToggle, onNext, onOpenList, onStop }) {
  const [open, setOpen] = useState(false);
  const [stopped, setStopped] = useState(false);
  const bubble = useDraggableBubble('filmykeyfi:musicBubble');
  const panel = useDraggableBubble('filmykeyfi:musicPanel', { measure: true, detached: true });

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
        // Aşağı ok yalnızca pencereyi kapatır: şarkı çalmaya devam eder, köşedeki çemberden açılır.
        onCollapse={() => setOpen(false)}
        pos={panel.pos}
        bind={panel.bind}
        cardRef={panel.boxRef}
      />
    );
  }

  return (
    <MusicControllerBubble
      pos={bubble.pos}
      playing={playing}
      bind={bubble.bind}
      didDrag={bubble.didDrag}
      onOpen={() => setOpen(true)}
    />
  );
}