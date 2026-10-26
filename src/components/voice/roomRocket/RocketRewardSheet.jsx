import React, { useEffect, useState } from 'react';
import { Content } from '@radix-ui/react-dialog';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogPortal, DialogOverlay, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import useBackDismiss from '@/hooks/useBackDismiss';
import RocketWinnerZones from '@/components/voice/roomRocket/RocketWinnerZones';
import RocketRewardRules from '@/components/voice/roomRocket/RocketRewardRules';
import { REWARD_ART } from '@/components/voice/roomRocket/rocketArtwork';

export default function RocketRewardSheet({ data, loading, error, onClose, onRetry }) {
  const [level, setLevel] = useState(data?.level || 1);
  const [help, setHelp] = useState(false);
  useBackDismiss(true, onClose);
  useEffect(() => { setLevel(data?.level || 1); }, [data?.cycle]);
  const round = data?.history?.find(entry => entry.level === level && entry.cycle === data?.cycle);
  const winners = round?.winners || [];
  return <Dialog open onOpenChange={value => { if (!value) onClose(); }}><DialogPortal>
    <DialogOverlay className="z-[290] bg-slot-bg/75" />
    <Content className="room-rocket-sheet font-body text-slot-text">
      <DialogTitle className="sr-only">Roket Patlaması, LVL {level}</DialogTitle>
      <DialogDescription className="sr-only">Günlük hediye sıralaması ve roket seviyesi ödülleri.</DialogDescription>
      <Image src={REWARD_ART} alt="" aria-hidden="true" unoptimized loading="eager" decoding="sync" fittingType="fit" className="room-rocket-sheet-art" />
      <button type="button" className="room-rocket-close" aria-label="Kapat" onClick={onClose} />
      <button type="button" className="room-rocket-help" aria-label="Roket kuralları" onClick={() => setHelp(!help)} />
      <div className="room-rocket-tabs" role="tablist" aria-label="Roket seviyeleri">{[1, 2, 3, 4].map(value =>
        <button type="button" key={value} role="tab" aria-selected={level === value} aria-controls="room-rocket-winners" className={level === value ? 'is-selected' : ''} onClick={() => setLevel(value)}><span className="sr-only">LVL {value}</span></button>
      )}</div>
      <div id="room-rocket-winners" role="tabpanel" aria-label={`LVL ${level} kazananları`}><RocketWinnerZones winners={winners} level={level} /></div>
      <div className="room-rocket-sheet-status" role="status">{loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : error ? <button type="button" onClick={onRetry}>Yüklenemedi · Tekrar dene</button> : round ? `Tur ${round.cycle} · ${round.status === 'complete' ? 'Ödüller bakiyelere eklendi' : 'Ödüller dağıtılıyor'}${round.vip_level ? ` · 1. sıraya VIP${round.vip_level}` : ''}` : `Günlük sıralama · LVL ${level} roketi 1. sıraya VIP${[6, 7, 9, 11][level - 1]} hediye eder`}</div>
      {help && <RocketRewardRules onClose={() => setHelp(false)} />}
    </Content>
  </DialogPortal></Dialog>;
}