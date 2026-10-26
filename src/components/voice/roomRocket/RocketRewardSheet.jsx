import React, { useState } from 'react';
import { Content } from '@radix-ui/react-dialog';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogPortal, DialogOverlay, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import useBackDismiss from '@/hooks/useBackDismiss';
import RocketRewardRules from '@/components/voice/roomRocket/RocketRewardRules';
import { REWARD_PANEL_ART } from '@/components/voice/roomRocket/rocketArtwork';
import RocketRewardValues from '@/components/voice/roomRocket/RocketRewardValues';

export default function RocketRewardSheet({ data, loading, error, onClose, onRetry }) {
  const [level, setLevel] = useState(1);
  const [help, setHelp] = useState(false);
  useBackDismiss(true, onClose);
  return <Dialog open onOpenChange={value => { if (!value) onClose(); }}><DialogPortal>
    <DialogOverlay className="z-[290] bg-slot-bg/75" />
    <Content className="room-rocket-sheet font-body text-slot-text">
      <DialogTitle className="sr-only">Roket Patlaması, LVL {level}</DialogTitle>
      <DialogDescription className="sr-only">Günlük hediye sıralaması ve roket seviyesi ödülleri.</DialogDescription>
      <div id="room-rocket-winners" role="tabpanel" aria-label={`LVL ${level} ödülleri`}>
        <Image src={REWARD_PANEL_ART[0]} alt="Roket Patlaması ödül paneli" unoptimized blurPlaceholder={false} loading="eager" fittingType="fit" className="room-rocket-sheet-art" />
        <RocketRewardValues level={level} />
      </div>
      <button type="button" className="room-rocket-close" aria-label="Kapat" onClick={onClose} />
      <button type="button" className="room-rocket-help" aria-label="Roket kuralları" onClick={() => setHelp(!help)} />
      <div className="room-rocket-tabs" role="tablist" aria-label="Roket seviyeleri">{[1, 2, 3, 4].map(value =>
        <button type="button" key={value} role="tab" aria-selected={level === value} aria-controls="room-rocket-winners" className={level === value ? 'is-selected' : ''} onClick={() => setLevel(value)}><span className="sr-only">LVL {value}</span></button>
      )}</div>
      {(loading || error) && <div className="room-rocket-sheet-status" role="status">{loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : <button type="button" onClick={onRetry}>Yüklenemedi · Tekrar dene</button>}</div>}
      {help && <RocketRewardRules onClose={() => setHelp(false)} />}
    </Content>
  </DialogPortal></Dialog>;
}