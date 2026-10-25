import { useEffect, useRef, useState } from 'react';
import { Image } from '@/components/ui/image';

const DEDE_PNG = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/82ee50581_generated_91ebaea1.png';

export default function DedeWizard({ orbs, spinKey, rolling, spinning }) {
  const [strike, setStrike] = useState('idle');
  const struckSpin = useRef(0);
  const orbKey = (orbs || []).map(o => `${o.reel}:${o.row}:${o.value}`).join('-');
  useEffect(() => {
    if (!spinKey || rolling) return;
    if (!orbKey && (spinning || struckSpin.current === spinKey)) return;
    struckSpin.current = spinKey;
    setStrike(`${spinKey}:${orbKey || 'empty'}`);
  }, [spinKey, rolling, spinning, orbKey]);
  return (
    <div className="dede-wizard" aria-hidden="true">
      <div key={strike} className={`dede-wizard-cutout ${strike !== 'idle' ? 'dede-wizard-cutout-strike' : ''}`}>
        <Image src={DEDE_PNG} alt="" fittingType="fit" loading="eager" blurPlaceholder={false} className="dede-wizard-png" />
      </div>
    </div>
  );
}