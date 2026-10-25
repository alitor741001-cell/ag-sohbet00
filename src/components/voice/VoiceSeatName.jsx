import { useLayoutEffect, useRef, useState } from 'react';
import { Crown, Shield } from 'lucide-react';

export default function VoiceSeatName({ name = '', fullName, width, hidden, isOwner, isMod, color }) {
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState(10);
  const displayed = fullName ? name : Array.from(name).slice(0, 7).join('');
  useLayoutEffect(() => {
    const text = textRef.current;
    if (!text || fullName) return;
    text.style.fontSize = '10px';
    const available = text.clientWidth;
    setFontSize(text.scrollWidth > available ? 10 * available / text.scrollWidth : 10);
  }, [displayed, width, fullName, isOwner, isMod, hidden]);
  return (
    <span title={name} className="flex min-h-3 shrink-0 items-start justify-center gap-0.5 text-center text-[10px] leading-3" style={{ width, color }}>
      {!hidden && isOwner && <Crown className="h-3 w-3 shrink-0 text-amber-400" />}
      {!hidden && !isOwner && isMod && <Shield className="h-3 w-3 shrink-0 text-sky-400" />}
      <span ref={textRef} className={`min-w-0 ${fullName ? 'break-words whitespace-normal' : 'whitespace-nowrap'} ${hidden ? 'hidden-user-name' : ''}`} style={{ fontSize: fullName ? 10 : fontSize, overflowWrap: 'anywhere' }}>{displayed}</span>
    </span>
  );
}