let restore = null;
const owners = new Set();

/** Shared by custom sheets and chat viewports; release order cannot leak a lock. */
export default function acquirePageScrollLock() {
  const token = Symbol('page-scroll');
  if (!owners.size) {
    const body = document.body, html = document.documentElement;
    const x = window.scrollX, y = window.scrollY;
    const keys = ['position', 'top', 'left', 'width', 'overflow'];
    const saved = Object.fromEntries(keys.map(key => [key, body.style[key]]));
    const overflow = html.style.overflow;
    Object.assign(body.style, { position: 'fixed', top: `${-y}px`, left: `${-x}px`, width: '100%', overflow: 'hidden' });
    html.style.overflow = 'hidden';
    restore = () => {
      Object.assign(body.style, saved);
      html.style.overflow = overflow;
      window.scrollTo({ left: x, top: y, behavior: 'instant' });
    };
  }
  owners.add(token);
  return () => {
    if (!owners.delete(token) || owners.size) return;
    const release = restore;
    restore = null;
    release?.();
  };
}