import { DEDE_STAFF_VIDEO } from '@/components/games/dede/dedeAssets';
import useDedeWizardVideo from '@/components/games/dede/useDedeWizardVideo';

export default function DedeWizard({ orbs, spinKey, rolling, spinning }) {
  const playback = useDedeWizardVideo({ orbs, spinKey, rolling, spinning });
  return (
    <div className="dede-wizard">
      <video
        {...playback}
        src={DEDE_STAFF_VIDEO}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        className="dede-wizard-video"
        aria-label="Dede asasını avucunda tutarak yukarı kaldırır ve yere vurur. İki saniyelik oyun animasyonu."
      />
    </div>
  );
}