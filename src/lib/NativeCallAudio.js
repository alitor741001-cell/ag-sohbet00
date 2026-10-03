import { Room, LocalAudioTrack } from 'livekit-client';

// LiveKit 2.22's default silence test creates a temporary AudioContext even
// with webAudioMix:false. Calls use native audio only so iOS capture is not
// interrupted by starting/closing that analyser or a playback context.
export class NativeCallTrack extends LocalAudioTrack {
  async checkForSilence() { return false; }
}

export default class NativeCallAudio extends Room {
  async acquireAudioContext() {
    // All received tracks are played by their native HTMLAudioElements.
  }
}