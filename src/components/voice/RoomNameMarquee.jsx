import { useLayoutEffect, useRef, useState } from 'react';

/** Oda adı: sağdan girer, ortada 3 sn durur, sola çıkar; sürekli tekrarlar. */
export default function RoomNameMarquee({ text, className = '' }) {
  const boxRef = useRef(null);
  const textRef = useRef(null);
  const [size, setSize] = useState({ box: 0, text: 0 });

  useLayoutEffect(() => {
    const measure = () => setSize({ box: boxRef.current?.clientWidth || 0, text: textRef.current?.scrollWidth || 0 });
    measure();
    const ro = new ResizeObserver(measure);
    if (boxRef.current) ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, [text]);

  // Ortadaki duruş süresi (%30–%60) tam 3 sn olacak şekilde toplam 10 sn.
  const style = size.box ? {
    '--name-from': `${size.box}px`,
    '--name-to': `-${size.text}px`,
    animation: 'room-name-marquee 10s linear infinite',
  } : undefined;

  return (
    <span ref={boxRef} className={`block overflow-hidden whitespace-nowrap py-0.5 ${className}`}>
      <span ref={textRef} className="inline-block" style={style}>{text}</span>
    </span>
  );
}