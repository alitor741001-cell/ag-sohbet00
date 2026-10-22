import '@/components/voice/voiceSpeakingWave.css';
import { vipVars } from '@/components/vip/vipTheme';

export default function VoiceSpeakingWave({ index, ring, theme }) {
  if (theme) return <span aria-hidden="true" data-vip-shape={theme.shape} style={vipVars(theme)} className={`vip-wave pointer-events-none absolute ${ring} z-[5] rounded-full`} />;
  const phase = index % 24;
  return <span aria-hidden="true"
    className={`voice-speaking-wave pointer-events-none absolute ${ring} z-[5] rounded-full`}
    style={{ animationDelay: `${-phase * 0.5}s`, '--voice-wave-start': `hsl(${phase * 15} 90% 65%)` }} />;
}