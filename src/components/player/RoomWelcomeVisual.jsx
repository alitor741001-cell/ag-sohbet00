import AdminRoomWelcome from '@/components/admin/AdminWelcomeSplash';
import CanAblamWelcome from '@/components/player/CanAblamWelcome';
import CanAbimWelcome from '@/components/player/CanAbimWelcome';
import QueenAdminWelcome from '@/components/player/QueenAdminWelcome';

const VISUALS = {
  queenAdmin: QueenAdminWelcome,
  admin: AdminRoomWelcome,
  canAblam: CanAblamWelcome,
  canAbim: CanAbimWelcome,
};

export default function RoomWelcomeVisual({ type }) {
  const WelcomeVisual = VISUALS[type];
  return WelcomeVisual ? <WelcomeVisual /> : null;
}