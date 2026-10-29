import { useLayoutEffect, useRef, useState } from 'react';
import isAndroidDevice from '@/lib/isAndroidDevice';

// Uygulama onayı tarayıcı izninden ayrıdır; her yeni koltuk oturumunda sorulur.
export default function useSeatMicConsent(roomId, micEnabled) {
  const required = isAndroidDevice() && micEnabled !== undefined;
  const allowed = useRef(!required);
  const [prompt, setPrompt] = useState(required && !!micEnabled);
  useLayoutEffect(() => {
    allowed.current = !required;
    setPrompt(required && !!micEnabled);
  }, [roomId, micEnabled, required]);
  const allow = () => { allowed.current = true; setPrompt(false); };
  const deny = () => { allowed.current = false; setPrompt(false); };
  return { allowed, prompt, allow, deny };
}