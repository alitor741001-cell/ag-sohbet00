import SimpleWelcomeVisual from '@/components/player/SimpleWelcomeVisual';

const SPLASH_IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/d347c339e_DC7A03E8-EC9C-41E8-9396-51599FADBA05.png';

export default function AdminRoomWelcome({ onDone }) {
  return <SimpleWelcomeVisual src={SPLASH_IMAGE} alt="Admin Hoş Geldin" onDone={onDone} />;
}