import AdminRoomWelcome from '@/components/admin/AdminWelcomeSplash';
import CanAblamWelcome from '@/components/player/CanAblamWelcome';
import CanAbimWelcome from '@/components/player/CanAbimWelcome';
import GULWelcome from '@/components/player/GULWelcome';
import QueenAdminWelcome from '@/components/player/QueenAdminWelcome';

const VISUALS = {
  queenAdmin: QueenAdminWelcome,
  admin: AdminRoomWelcome,
  canAblam: CanAblamWelcome,
  canAbim: CanAbimWelcome,
  gul: GULWelcome,
};

export default function RoomWelcomeVisual({ type, onDone }) {
  const WelcomeVisual = VISUALS[type];
  return WelcomeVisual ? <WelcomeVisual onDone={onDone} /> : null;
}