import { useEffect, useState } from 'react';

export default function StartupSplash() {
  const [visible] = useState(false);
  useEffect(() => {}, []);
  if (!visible) return null;
  return null;
}