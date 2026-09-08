import SimpleWelcomeVisual from '@/components/player/SimpleWelcomeVisual';

const SPLASH_IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/4e5712d1d_A8B0DCD3-551D-4897-9257-58082DA9FF07.png';

export default function QueenAdminWelcome({ onDone }) {
  return <SimpleWelcomeVisual src={SPLASH_IMAGE} alt="Admin Kraliçesi" onDone={onDone} />;
}