import AdminRoomWelcome from '@/components/admin/AdminWelcomeSplash';
import CanAblamWelcome from '@/components/player/CanAblamWelcome';
import CanAbimWelcome from '@/components/player/CanAbimWelcome';
import GULWelcome from '@/components/player/GULWelcome';
import QueenAdminWelcome from '@/components/player/QueenAdminWelcome';
import RoomFrameWelcome from '@/components/player/RoomFrameWelcome';

const VISUALS = {
  queenAdmin: QueenAdminWelcome,
  admin: AdminRoomWelcome,
  canAblam: CanAblamWelcome,
  canAbim: CanAbimWelcome,
  gul: GULWelcome,
};

export default function RoomWelcomeVisual({ type, onDone }) {
  const WelcomeVisual = VISUALS[type];
  if (!WelcomeVisual) return null;
  return (
    <>
      <RoomFrameWelcome type={type} />
      <WelcomeVisual onDone={onDone} />
    </>
  );
}