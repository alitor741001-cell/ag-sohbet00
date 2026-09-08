import SimpleWelcomeVisual from '@/components/player/SimpleWelcomeVisual';

const SPLASH_IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a4a0d6a4e_C9B47EF9-82D0-4BA9-B7E7-FD24C74FD9AE.png';

export default function CanAbimWelcome({ onDone }) {
  return <SimpleWelcomeVisual src={SPLASH_IMAGE} alt="Can Abim - Kral Turgay" onDone={onDone} />;
}