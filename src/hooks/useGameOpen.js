import { useEffect, useState } from 'react';

/** Oyun merkezi açıkken (body.game-open) true döner: oyun sırasında oda efektleri bastırılır. */
export default function useGameOpen() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const node = document.body;
    const sync = () => setOpen(node.classList.contains('game-open'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(node, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return open;
}