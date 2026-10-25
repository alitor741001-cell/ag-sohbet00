import { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';
import { DEDE_STAFF_VIDEO } from '@/components/games/dede/dedeAssets';
import useDedeStaffPlayback from '@/components/games/dede/useDedeStaffPlayback';

const DEDE_PNG = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/82ee50581_generated_91ebaea1.png';

export default function DedeWizard({ orbs, spinKey, rolling }) {
  const [strike, setStrike] = useState(0);
  const { videoRef, canvasRef, failed, onError } = useDedeStaffPlayback(strike);
  const orbKey = (orbs || []).map(o => `${o.reel}:${o.row}:${o.value}`).join('-');
  useEffect(() => {
    if (!spinKey || rolling || !orbKey) return;
    setStrike(value => value + 1);
  }, [spinKey, rolling, orbKey]);
  return (
    <div className="dede-wizard" aria-hidden="true">
      <video ref={videoRef} src={DEDE_STAFF_VIDEO} crossOrigin="anonymous" muted playsInline preload="auto" disablePictureInPicture onError={onError} className="dede-wizard-source" />
      <canvas ref={canvasRef} width={216} height={384} className={`dede-wizard-motion ${failed ? 'hidden' : ''}`} />
      {failed && <Image src={DEDE_PNG} alt="" fittingType="fit" loading="eager" blurPlaceholder={false} className="dede-wizard-png" />}
    </div>
  );
}