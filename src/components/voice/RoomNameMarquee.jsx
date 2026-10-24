import { useLayoutEffect, useRef, useState } from 'react';

/** Oda adı: sığmazsa sola kayar, başa döndüğünde 3 sn bekler, tekrar kayar. */
export default function RoomNameMarquee({ text, className = '' }) {
  const boxRef = useRef(null);
  const textRef = useRef(null);
  const [shift, setShift] = useState(0);

  useLayoutEffect(() => {
    const measure = () => setShift(Math.max(0, (textRef.current?.scrollWidth || 0) - (boxRef.current?.clientWidth || 0)));
    measure();
    const ro = new ResizeObserver(measure);
    if (boxRef.current) ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, [text]);

  const move = Math.max(2, shift / 30); // ~30px/sn
  const total = move + 3;
  const style = shift > 0 ? {
    '--name-shift': `-${shift}px`,
    '--name-hold': `${(3 / total) * 100}%`,
    animation: `room-name-marquee ${total}s linear infinite`,
  } : undefined;

  return (
    <span ref={boxRef} className={`block overflow-hidden whitespace-nowrap ${className}`}>
      <span ref={textRef} className="room-name-marquee inline-block" style={style}>{text}</span>
    </span>
  );
}