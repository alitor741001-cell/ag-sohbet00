import { createContext, useContext } from 'react';

/**
 * Sesli oda, profil kartındaki oda işlemlerini (mikrofon, koltuk kilidi, hediye, bahset)
 * bu bağlam üzerinden karta verir. Oda dışında kart bu işlemleri pasif gösterir.
 */
const RoomProfileActionsContext = createContext(null);

export const RoomProfileActionsProvider = RoomProfileActionsContext.Provider;

export function useRoomProfileActions() {
  return useContext(RoomProfileActionsContext);
}