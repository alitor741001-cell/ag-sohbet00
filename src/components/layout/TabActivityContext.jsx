import { createContext, useContext } from 'react';

export const TabActivityContext = createContext(true);
export default function useTabActivity() {
  return useContext(TabActivityContext);
}