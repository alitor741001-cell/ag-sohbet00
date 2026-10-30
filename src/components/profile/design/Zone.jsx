/** Tasarım görseli üzerinde yüzde koordinatlı alan (görsel 682×1024). */
export default function Zone({ x, y, w, h, onClick, label, className = '', children }) {
  const style = { left: `${(x / 682) * 100}%`, top: `${(y / 1024) * 100}%`, width: `${(w / 682) * 100}%`, height: `${(h / 1024) * 100}%` };
  const cls = `absolute flex items-center justify-center ${className}`;
  if (!onClick) return <div className={cls} style={style}>{children}</div>;
  return <button type="button" aria-label={label} onClick={onClick} className={`${cls} rounded-2xl active:bg-white/10`} style={style}>{children}</button>;
}