export default function XpAvatar({ src, alt, className }) {
  return src ? <img src={src} alt={alt} className={className} /> : <div className={className} />;
}