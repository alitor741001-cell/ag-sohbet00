import OkeyModeIcon from './OkeyModeIcon';
import ReferenceChoiceButton from '@/components/games/controls/ReferenceChoiceButton';

/** Dizilim tuşları: SERİ DİZ ve ÇİFT DİZ — işlem şeridinde yan yana durur. */
export default function OkeyModeButtons({ mode, onMode }) {
  return (
    <span className="okey-modes">
      <ReferenceChoiceButton
        type="button"
        className="okey-btn okey-mode-btn"
        data-on={mode === 'seri' ? '1' : '0'}
        onClick={() => onMode('seri')}
      >
        <OkeyModeIcon variant="seri" />
        SERİ DİZ
      </ReferenceChoiceButton>
      <ReferenceChoiceButton
        type="button"
        className="okey-btn okey-mode-btn"
        data-on={mode === 'cift' ? '1' : '0'}
        onClick={() => onMode('cift')}
      >
        <OkeyModeIcon variant="cift" />
        ÇİFT DİZ
      </ReferenceChoiceButton>
    </span>
  );
}