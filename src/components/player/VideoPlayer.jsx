import { useEffect, useRef, useState, forwardRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, SkipBack, SkipForward } from 'lucide-react';

const VideoPlayer = forwardRef(({ src, poster }, ref) => {
  const innerRef = useRef(null);
  const videoRef = ref || innerRef;
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => { setProgress(v.currentTime); setDuration(v.duration); };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    const onLoaded = () => setLoading(false);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('waiting', onWaiting);
    v.addEventListener('playing', onPlaying);
    v.addEventListener('loadeddata', onLoaded);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('waiting', onWaiting);
      v.removeEventListener('playing', onPlaying);
      v.removeEventListener('loadeddata', onLoaded);
    };
  }, []);

  const toggle = () => { const v = videoRef.current; if (!v) return; if (v.paused) v.play(); else v.pause(); };
  const toggleMute = () => { const v = videoRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); };
  const seek = (e) => { const v = videoRef.current; if (!v || !v.duration) return; const rect = e.currentTarget.getBoundingClientRect(); v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration; };
  const fullscreen = () => { const v = videoRef.current; if (!v) return; if (document.fullscreenElement) document.exitFullscreen(); else v.requestFullscreen(); };
  const skip = (sec) => { const v = videoRef.current; if (!v) return; v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + sec)); };

  const fmt = (s) => { if (!s || isNaN(s)) return '0:00'; const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, '0')}`; };

  return (
    <div className="relative w-full h-full bg-black group">
      <video ref={videoRef} src={src} poster={poster} className="w-full h-full object-contain" playsInline onClick={toggle} />
      {loading && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Loader2 className="w-12 h-12 text-white/80 animate-spin" /></div>}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-white">{fmt(progress)}</span>
          <div className="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer" onClick={seek}>
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
          </div>
          <span className="text-xs text-white">{fmt(duration)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">{playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}</button>
          <button onClick={() => skip(-10)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><SkipBack className="w-4 h-4 text-white" /></button>
          <button onClick={() => skip(10)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><SkipForward className="w-4 h-4 text-white" /></button>
          <button onClick={toggleMute} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">{muted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}</button>
          <button onClick={fullscreen} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 ml-auto"><Maximize className="w-4 h-4 text-white" /></button>
        </div>
      </div>
    </div>
  );
});
VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;