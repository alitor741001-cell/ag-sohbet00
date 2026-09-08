import SimpleWelcomeVisual from '@/components/player/SimpleWelcomeVisual';

const SPLASH_IMAGE = 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62/4dd38abed_admin-kralicesi-gercek-seffaf.png';

export default function QueenAdminWelcome({ onDone }) {
  return <SimpleWelcomeVisual src={SPLASH_IMAGE} alt="Admin Kraliçesi" onDone={onDone} />;
}