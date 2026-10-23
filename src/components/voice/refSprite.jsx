// Gönderilen sesli oda tasarım görseli (872x1804). Her parça bu görselden kesilerek gösterilir.
export const REF_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/0bc783098_IMG_0180.jpg';
const W = 872;
const H = 1804;

/** Görselin [x,y,w,h] bölgesini kutuyu tam dolduracak şekilde çizer. */
export default function RefSprite({ x, y, w, h, className = '', style, children }) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        aspectRatio: `${w} / ${h}`,
        backgroundImage: `url(${REF_URL})`,
        backgroundSize: `${(W / w) * 100}% ${(H / h) * 100}%`,
        backgroundPosition: `${(x / (W - w)) * 100}% ${(y / (H - h)) * 100}%`,
        backgroundRepeat: 'no-repeat',
        ...style,
      }}
    >
      {children}
    </div>
  );
}