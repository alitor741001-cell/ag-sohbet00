import React, { useState } from 'react';
import RoomRocketBadge from '@/components/voice/roomRocket/RoomRocketBadge';
import RocketRewardSheet from '@/components/voice/roomRocket/RocketRewardSheet';
import useRoomRocket from '@/components/voice/roomRocket/useRoomRocket';
import '@/components/voice/roomRocket/roomRocket.css';

export default function RoomRocketFeature({ room, hidden }) {
  const [open, setOpen] = useState(false);
  const query = useRoomRocket(room, open);
  if (!room) return null;
  return <>
    {!hidden && <RoomRocketBadge data={query.data} loading={query.isLoading} error={query.isError} onOpen={() => setOpen(true)} />}
    {open && <RocketRewardSheet data={query.data} loading={query.isLoading} error={query.isError} onClose={() => setOpen(false)} onRetry={query.refetch} />}
  </>;
}