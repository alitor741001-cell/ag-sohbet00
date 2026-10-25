import { Image } from '@/components/ui/image';
import { DEDE_DEITY, DEDE_STAFF } from '@/components/games/dede/dedeAssets';

export default function DedeWizard({ orbs, spinKey, rolling }) {
  const active = !rolling && orbs?.length > 0;
  const cue = active ? `${spinKey}-${orbs.map(o => `${o.reel}:${o.row}:${o.value}`).join('-')}` : 'idle';
  return (
    <div className="dede-wizard" aria-hidden="true">
      <div key={cue} className={`dede-wizard-pose ${active ? 'dede-wizard-striking' : ''}`}>
        <Image src={DEDE_DEITY} alt="" fittingType="fit" blurPlaceholder={false} loading="eager" className="dede-wizard-body" />
        <span className="dede-wizard-staff-position">
          <Image src={DEDE_STAFF} alt="" fittingType="fit" blurPlaceholder={false} loading="eager" className="dede-wizard-staff" />
        </span>
        <Image src={DEDE_DEITY} alt="" fittingType="fit" blurPlaceholder={false} loading="eager" className="dede-wizard-grip" />
        {active && <span className="dede-wizard-impact" />}
      </div>
    </div>
  );
}