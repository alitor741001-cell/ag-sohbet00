import { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';
import { DEDE_STAFF_VIDEO } from '@/components/games/dede/dedeAssets';
import useDedeStaffPlayback from '@/components/games/dede/useDedeStaffPlayback';

const DEDE_PNG = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/82ee50581_generated_91ebaea1.png';
// Vuruşun görsel şiddeti: asa indiği anda karakter bir an gerilip öne atılır.
const SMASH_MS = 820;

export default function DedeWizard({ orbs, spinKey, rolling }) {
  const [strike, setStrike] = useState(0);
  const [smashing, setSmashing] = useState(false);
  const { videoRef, canvasRef, failed, onError } = useDedeStaffPlayback(strike);
  const orbKey = (orbs || []).map(o => `${o.reel}:${o.row}:${o.value}`).join('-');
  // Çarpan küreleri ekranda göründüğü an asa iner.
  useEffect(() => {
    if (!spinKey || rolling || !orbKey) return;
    setStrike(value => value + 1);
  }, [spinKey, rolling, orbKey]);
  useEffect(() => {
    if (!strike) return undefined;
    setSmashing(true);
    const timer = setTimeout(() => setSmashing(false), SMASH_MS);
    return () => clearTimeout(timer);
  }, [strike]);
  return (
    <div className={`dede-wizard ${smashing ? 'dede-wizard-boom' : ''}`} aria-hidden="true">
      <video ref={videoRef} src={DEDE_STAFF_VIDEO} crossOrigin="anonymous" muted playsInline preload="auto" disablePictureInPicture onError={onError} className="dede-wizard-source" />
      <canvas ref={canvasRef} width={216} height={384} className={`dede-wizard-motion ${failed ? 'hidden' : ''}`} />
      {failed && <Image src={DEDE_PNG} alt="" fittingType="fit" loading="eager" blurPlaceholder={false} className="dede-wizard-png" />}
      {strike > 0 && <span key={strike} className="dede-wizard-burst" />}
    </div>
  );
}