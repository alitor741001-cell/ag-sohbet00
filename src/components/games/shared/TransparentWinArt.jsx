import React, { useEffect, useRef } from 'react';

const cache = new Map();

export default function TransparentWinArt({ src, session, award }) {
  const ref = useRef(null);
  useEffect(() => {
    let active = true;
    const key = `${src}:${session}:${award}`;
    if (!cache.has(key)) cache.set(key, new Promise(resolve => {
      const image = new window.Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = pixels.data;
        for (let i = 0; i < data.length; i += 4) {
          const x = (i / 4 % canvas.width) / canvas.width;
          const y = Math.floor(i / 4 / canvas.width) / canvas.height;
          const buttonText = x > .27 && x < .74 && y > (session ? .737 : .83) && y < (session ? .779 : .875);
          if (buttonText) continue;
          const light = data[i] * .2126 + data[i + 1] * .7152 + data[i + 2] * .0722;
          const opacity = Math.min(1, Math.max(0, (light - 30) / 65));
          data[i + 3] = Math.round(255 * opacity * opacity * (3 - 2 * opacity));
        }
        ctx.putImageData(pixels, 0, 0);
        const area = session ? [.255, .575, .615, .064] : [.24, .60, .67, .088];
        ctx.clearRect(area[0] * canvas.width, area[1] * canvas.height, area[2] * canvas.width, area[3] * canvas.height);
        if (award) ctx.clearRect(.29 * canvas.width, .53 * canvas.height, .43 * canvas.width, .03 * canvas.height);
        resolve(canvas);
      };
      image.src = src;
    }));
    cache.get(key).then(canvas => {
      if (!active || !ref.current) return;
      ref.current.width = canvas.width;
      ref.current.height = canvas.height;
      ref.current.getContext('2d').drawImage(canvas, 0, 0);
    });
    return () => { active = false; };
  }, [src, session, award]);
  return <canvas ref={ref} className="game-win-artwork-image" aria-hidden="true" />;
}