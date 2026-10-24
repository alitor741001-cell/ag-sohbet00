import { useEffect, useState } from 'react';

// Görseldeki beyaz zemin tarayıcıda şeffaflaştırılır: tasarım PNG gibi temanın üstünde durur.
export default function useTransparentArt(url) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const min = Math.min(px[i], px[i + 1], px[i + 2]);
        if (min > 235) px[i + 3] = 0;
        else if (min > 200) px[i + 3] = Math.round(((235 - min) / 35) * 255);
      }
      ctx.putImageData(data, 0, 0);
      setSrc(canvas.toDataURL('image/png'));
    };
    img.src = url;
  }, [url]);
  return src;
}