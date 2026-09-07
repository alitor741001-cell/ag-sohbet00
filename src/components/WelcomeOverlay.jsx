import { useEffect, useState } from 'react';

export default function WelcomeOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return <div className="welcome-overlay"><span className="welcome-neon">HOŞ GELDİNİZ</span></div>;
}