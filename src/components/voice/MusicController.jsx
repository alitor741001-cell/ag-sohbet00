import { useState } from 'react';
import useDraggableBubble from '@/hooks/useDraggableBubble';
import MusicControllerBubble from '@/components/voice/MusicControllerBubble';
import MusicControllerCard from '@/components/voice/MusicControllerCard';

/**
 * Oda müziği denetleyicisi: pencere kapandığında köşede çember olarak kalır,
 * dokununca panel açılır; ses seviyesi bu cihazda canlı ayarlanır.
 */
export default function MusicController({ title, playing, volume, onVolume, isMod, onToggle, onNext, onOpenList, onStop }) {
  const [open, setOpen] = useState(false);
  const { pos, bind, didDrag } = useDraggableBubble('filmykeyfi:musicBubble');

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
        onStop={onStop}
        onCollapse={() => setOpen(false)}
      />
    );
  }

  return <MusicControllerBubble pos={pos} playing={playing} bind={bind} didDrag={didDrag} onOpen={() => setOpen(true)} />;
}