import React from 'react';
import { Loader2 } from 'lucide-react';
import { Image } from '@/components/ui/image';
import useRocketPng from '@/components/voice/roomRocket/useRocketPng';
import { TARGET_LABELS } from '@/components/voice/roomRocket/rocketArtwork';
import formatCoinAmount from '@/components/voice/formatCoinAmount';
import '@/components/voice/roomRocket/roomRocketBadgeFit.css';

export default function RoomRocketBadge({ data, loading, error, onOpen }) {
  const level = data?.level || 1;
  const src = useRocketPng(level);
  const progress = formatCoinAmount(data?.progress);
  return <button type="button" className="room-rocket-badge" data-level={level} onClick={onOpen} aria-label={`LVL ${level} roketi, ${progress}/${TARGET_LABELS[level - 1]}. Ödülleri aç`}>
    {src ? <Image src={src} alt={`LVL ${level} roketi`} fittingType="fit" className="room-rocket-badge-image" /> : <Loader2 className="h-6 w-6 animate-spin" />}
    <span className="room-rocket-progress" aria-live="polite">{loading ? '…' : error ? 'Tekrar aç' : `${progress}/${TARGET_LABELS[level - 1]}`}</span>
  </button>;
}