import { createContext, useContext } from 'react';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import useMaleRoomArt from '@/hooks/useMaleRoomArt';
import '@/components/voice/maleRoomTheme.css';
const Theme = createContext({ male: false, art: '' });
export const useMaleRoomTheme = () => useContext(Theme);
export default function MaleRoomTheme({ ownerId, user, children }) {
  const profiles = useMessageProfiles(ownerId ? [ownerId] : []);
  const owner = user?.id === ownerId ? user : profiles[ownerId];
  const male = owner?.gender === 'erkek';
  const art = useMaleRoomArt(male);
  return <Theme.Provider value={{ male: male && !!art, art }}><div className={male && art ? 'male-room-theme contents' : 'contents'}>{children}</div></Theme.Provider>;
}