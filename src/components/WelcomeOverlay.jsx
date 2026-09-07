import { useEffect, useState } from 'react';

export default function WelcomeOverlay() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 8000);
    const removeTimer = setTimeout(() => setVisible(false), 10000);
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div className={`welcome-overlay ${fading ? 'welcome-fading' : 'welcome-visible'}`}>
      <h1 className="welcome-neon">HOŞ GELDİNİZ</h1>
    </div>
  );
}