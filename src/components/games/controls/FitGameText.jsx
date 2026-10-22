import React, { useLayoutEffect, useRef } from 'react';

/** Keeps the complete label or amount inside its available width. */
export default function FitGameText({ as: Tag = 'span', children, className = '', ...props }) {
  const box = useRef(null);
  const text = useRef(null);
  useLayoutEffect(() => {
    const fit = () => {
      if (!box.current?.isConnected || !text.current) return;
      const available = box.current.clientWidth;
      if (!available) return;
      text.current.style.fontSize = 'inherit';
      const base = parseFloat(getComputedStyle(box.current).fontSize);
      const natural = text.current.getBoundingClientRect().width;
      if (natural > available) {
        text.current.style.fontSize = `${base * Math.max(0, available - 1) / natural}px`;
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box.current);
    window.addEventListener('resize', fit);
    document.fonts?.ready.then(fit);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [children]);
  return (
    <Tag {...props} ref={box} className={`ref-fit-text ${className}`}>
      <span ref={text} className="ref-fit-text-inner">{children}</span>
    </Tag>
  );
}