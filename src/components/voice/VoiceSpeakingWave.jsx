import '@/components/voice/voiceSpeakingWave.css';

export default function VoiceSpeakingWave({ index, ring }) {
  const phase = index % 24;
  return <span aria-hidden="true"
    className={`voice-speaking-wave pointer-events-none absolute ${ring} z-[5] rounded-full`}
    style={{ animationDelay: `${-phase * 0.5}s`, '--voice-wave-start': `hsl(${phase * 15} 90% 65%)` }} />;
}