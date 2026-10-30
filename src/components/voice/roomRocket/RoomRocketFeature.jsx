import React, { useEffect, useState } from 'react';
import RoomRocketBadge from '@/components/voice/roomRocket/RoomRocketBadge';
import RocketRewardSheet from '@/components/voice/roomRocket/RocketRewardSheet';
import useRoomRocket from '@/components/voice/roomRocket/useRoomRocket';
import useRocketEvents from '@/components/voice/roomRocket/useRocketEvents';

import RoomRocketCelebration from '@/components/voice/roomRocket/RoomRocketCelebration';
import useGameOpen from '@/hooks/useGameOpen';
import '@/components/voice/roomRocket/roomRocket.css';

export default function RoomRocketFeature({ room, hidden }) {
  const [open, setOpen] = useState(false);
  const query = useRoomRocket(room, open);
  const { active, complete } = useRocketEvents(room?.id, query.data);
  const gameOpen = useGameOpen();
  const activeId = active?.id;

  // Oyun oynanırken roket patlaması oyunun üstüne binmez: roket animasyonu ve
  // "kazandınız" kartı açılmaz, olay sessizce tüketilir.
  useEffect(() => {
    if (gameOpen && activeId) complete();
  }, [gameOpen, activeId]);

  const awaitingPayment = !!active?.my_award && !active.my_award.paid;
  useEffect(() => {
    if (!awaitingPayment) return;
    const timer = setInterval(() => query.refetch(), 2000);
    return () => clearInterval(timer);
  }, [awaitingPayment, query.refetch]);
  if (!room) return null;
  return <>
    {!hidden && <RoomRocketBadge data={query.data} loading={query.isLoading} error={query.isError} onOpen={() => setOpen(true)} />}
    {open && !active && <RocketRewardSheet data={query.data} loading={query.isLoading} error={query.isError} onClose={() => setOpen(false)} onRetry={query.refetch} />}
    {active && !gameOpen && <RoomRocketCelebration key={active.id} event={active} roomId={room.id} onComplete={complete} />}
  </>;
}