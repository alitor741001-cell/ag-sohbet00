import { CircleDot, Cherry, Crown, Dice5, Gem, Grape, Rocket, Sparkles, Trophy } from 'lucide-react';
import { GAME_COVER } from '@/components/games/slotAssets';
import { FRUIT_COVER } from '@/components/games/fruit/fruitAssets';
import { SEKERLI_COVER } from '@/components/games/sekerli/sekerliAssets';
import { ELIMIN_COVER } from '@/components/games/elimin/eliminAssets';
import { ROULETTE_COVER } from '@/components/games/roulette/rouletteAssets';
import { ZAR_COVER } from '@/components/games/zar/zarAssets';
import { ROCKET_COVER } from '@/components/games/rocketAssets';
import { FUTBOL_COVER } from '@/components/games/futbol/futbolAssets';
import { OKEY_COVER } from '@/components/games/okey/okeyAssets';

// Her oyunun kazanç kartı: kendi kapağı madalyonda, kendi renkleri ve simgesi.
export const WIN_THEMES = {
  slot: { cover: GAME_COVER, icon: Sparkles, title: 'SLOT ÖDÜLÜ', top: '#4c1a66', bottom: '#1d0830', glow: 'rgba(192,38,211,0.5)', accent: '#f0abfc' },
  fruit: { cover: FRUIT_COVER, icon: Cherry, title: 'MEYVE ÖDÜLÜ', top: '#1f5a1a', bottom: '#0b2a0a', glow: 'rgba(132,204,22,0.45)', accent: '#fed7aa' },
  sekerli: { cover: SEKERLI_COVER, icon: Grape, title: 'ŞEKERLİ MEYVE ÖDÜLÜ', top: '#6b1030', bottom: '#26040f', glow: 'rgba(251,113,133,0.5)', accent: '#fecdd3' },
  elimin: { cover: ELIMIN_COVER, icon: Gem, title: 'ELİMİNSLOT ÖDÜLÜ', top: '#0e4d5c', bottom: '#04202a', glow: 'rgba(34,211,238,0.45)', accent: '#a5f3fc' },
  roulette: { cover: ROULETTE_COVER, icon: CircleDot, title: 'RULET ÖDÜLÜ', top: '#6b0f12', bottom: '#1c0405', glow: 'rgba(239,68,68,0.45)', accent: '#bbf7d0' },
  zar: { cover: ZAR_COVER, icon: Dice5, title: 'ZAR ÖDÜLÜ', top: '#5c1010', bottom: '#1a0404', glow: 'rgba(248,113,113,0.45)', accent: '#fde68a' },
  rocket: { cover: ROCKET_COVER, icon: Rocket, title: 'GÖKKARTAL ÖDÜLÜ', top: '#12306b', bottom: '#050d24', glow: 'rgba(56,189,248,0.45)', accent: '#fdba74' },
  futbol: { cover: FUTBOL_COVER, icon: Trophy, title: 'ALTIN GOL ÖDÜLÜ', top: '#0f5a2e', bottom: '#03200f', glow: 'rgba(34,197,94,0.45)', accent: '#bbf7d0' },
  okey: { cover: OKEY_COVER, icon: Crown, title: 'OKEY ÖDÜLÜ', top: '#5a3412', bottom: '#1f1005', glow: 'rgba(251,191,36,0.4)', accent: '#fde68a' },
};