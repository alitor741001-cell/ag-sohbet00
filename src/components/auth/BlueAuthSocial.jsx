import { Loader2 } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';
import AppleIcon from '@/components/AppleIcon';

export default function BlueAuthSocial({ loading, onProvider }) {
  return <div className="blue-auth-social">
    <button type="button" className="blue-auth-secondary" disabled={!!loading} onClick={() => onProvider('google')}>
      {loading === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />} Google
    </button>
    <button type="button" className="blue-auth-secondary" disabled={!!loading} onClick={() => onProvider('apple')}>
      {loading === 'apple' ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleIcon className="h-4 w-4" />} Apple
    </button>
  </div>;
}