import { useRef } from 'react';
import useVoiceRoomViewport from '@/hooks/useVoiceRoomViewport';
import '@/components/voice/voiceViewport.css';

export default function VoiceViewport({ children, className = '', style, onKeyboardChange }) {
  const ref = useRef(null);
  useVoiceRoomViewport(ref, onKeyboardChange);
  return <div ref={ref} style={style} className={`voice-viewport dark fixed inset-x-0 flex flex-col overflow-hidden bg-catalog text-slot-text ${className}`}>{children}</div>;
}