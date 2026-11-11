import { useEffect, useState } from 'react';

/**
 * Tur boyunca patlayan nesneleri ve inen çarpanları biriktirir.
 * Her patlamada o adımın kazanan nesneleri eklenir; yeni çevirmede tepsi boşalır.
 */
export default function useDedeTray(game) {
  const [tray, setTray] = useState({ symbols: [], orbs: [] });

  useEffect(() => { setTray({ symbols: [], orbs: [] }); }, [game.spinKey]);

  useEffect(() => {
    if (!game.explode) return;
    setTray((prev) => {
      const symbols = [...prev.symbols];
      (game.wins || []).forEach((win) => {
        if (win.scatter || !win.cells?.length) return;
        const found = symbols.find((item) => item.id === win.symbol);
        if (found) found.count += win.cells.length;
        else symbols.push({ id: win.symbol, count: win.cells.length });
      });
      const orbs = [...prev.orbs, ...(game.orbs || []).map((orb) => orb.value)];
      return { symbols: symbols.map((item) => ({ ...item })), orbs };
    });
  }, [game.explode]);

  return tray;
}