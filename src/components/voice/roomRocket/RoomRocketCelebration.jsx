import React, { useRef, useState } from 'react';
import { Content } from '@radix-ui/react-dialog';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogPortal, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import useBackDismiss from '@/hooks/useBackDismiss';
import RocketLaunch from '@/components/voice/roomRocket/RocketLaunch';
import RocketPersonalReward from '@/components/voice/roomRocket/RocketPersonalReward';
import '@/components/voice/roomRocket/rocketCelebration.css';

export default function RoomRocketCelebration({ event, roomId, art, error, onComplete }) {
  const [phase, setPhase] = useState('launch');
  const done = useRef(onComplete);
  done.current = onComplete;
  const hasAward = !!event.my_award;
  useBackDismiss(true, onComplete);
  const finishLaunch = () => { if (hasAward) setPhase('reward'); else done.current(); };
  return <Dialog open onOpenChange={open => { if (!open && phase === 'reward' && event.my_award?.paid) onComplete(); }}><DialogPortal>
    <Content className="rocket-celebration font-body" onPointerDownOutside={e => e.preventDefault()}>
      <DialogTitle className="sr-only">{phase === 'launch' ? `LVL ${event.level} roketi patladı!` : `${event.my_award.amount} coin kazandın!`}</DialogTitle>
      <DialogDescription className="sr-only">{phase === 'launch' ? 'Roket havalanıyor.' : 'Ödül bakiyene eklendikten sonra Kabul Et ile kapat.'}</DialogDescription>
      {phase === 'launch' ? <RocketLaunch onComplete={finishLaunch} /> : error ? <div className="text-center text-slot-text"><p>Görsel yüklenemedi.</p><button type="button" className="mt-3 rounded-full bg-slot-gold px-5 py-2 text-slot-bg" onClick={onComplete}>TAMAM</button></div> : !art ? <Loader2 className="h-8 w-8 animate-spin text-slot-gold" /> : <RocketPersonalReward src={art.reward} award={event.my_award} roomId={roomId} onAccept={onComplete} />}
    </Content>
  </DialogPortal></Dialog>;
}