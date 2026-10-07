import { useRef } from 'react';
import useChatViewport from '@/hooks/useChatViewport';
import '@/components/voice/voiceViewport.css';

export default function VoiceViewport({ children, className = '', onKeyboardChange }) {
  const ref = useRef(null);
  useChatViewport(ref, onKeyboardChange);
  return <div ref={ref} className={`voice-viewport dark fixed inset-x-0 flex flex-col overflow-hidden bg-catalog text-slot-text ${className}`}>{children}</div>;
}