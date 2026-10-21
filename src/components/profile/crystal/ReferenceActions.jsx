import { AtSign, Gift, MessageSquare } from 'lucide-react';
import ReferenceActionButton from '@/components/profile/crystal/ReferenceActionButton';

export default function ReferenceActions({ self, followNode, actions }) {
  return <div className={`reference-actions ${self ? 'reference-actions-self' : ''}`}>
    {!self && followNode}
    {!self && <ReferenceActionButton icon={MessageSquare} label="Sohbet" onClick={actions.chat} />}
    {!self && <ReferenceActionButton icon={AtSign} label="Bahsetme" onClick={actions.mention} />}
    <ReferenceActionButton icon={Gift} label="Hediye" onClick={actions.gift} />
  </div>;
}