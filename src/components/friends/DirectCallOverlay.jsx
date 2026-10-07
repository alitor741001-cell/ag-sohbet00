import { useState } from 'react';
import { ArrowLeft, Loader2, Mic, MicOff, Phone, PhoneOff, SwitchCamera, Video, VideoOff, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CallBubble from '@/components/friends/CallBubble';
import CallModerationNotice from '@/components/friends/CallModerationNotice';
import CallVideoTile from '@/components/friends/CallVideoTile';
import { useDirectCall } from '@/lib/DirectCallContext';
import XpAvatar from '@/components/xp/XpAvatar';
import ProfileFrame from '@/components/ProfileFrame';
import CallCircleButton from '@/components/friends/CallCircleButton';

const formatDuration = (total) => {
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};

export default function DirectCallOverlay() {
  const navigate = useNavigate();
  const { call, role, phase, seconds, muted, speaker, error, minimized, remoteMuted, cameraOn, remoteCameraOn, localVideoTrack, remoteVideoTrack, facing, moderationNotice, clearModerationNotice, minimizeCall, restoreCall, acceptCall, rejectCall, endCall, toggleMute, toggleSpeaker, toggleCamera, switchCamera, startVideo, answerVideo, cancelVideo } = useDirectCall();
  // Kancalar erken çıkışların üstünde durur: arama başlarken durum değişse bile sıra bozulmaz.
  const [feeAsk, setFeeAsk] = useState(false);
  // Uygunsuz görüntü uyarısı arama kapandıktan sonra da ekranda kalır.
  if (moderationNotice) return <CallModerationNotice notice={moderationNotice} onClose={clearModerationNotice} />;
  if (!call || phase === 'idle') return null;

  const other = role === 'callee'
    ? { id: call.caller_id, name: call.caller_name, avatar: call.caller_avatar, frame: call.caller_frame, frameScale: call.caller_frame_scale, gender: call.caller_gender }
    : { id: call.callee_id, name: call.callee_name, avatar: call.callee_avatar, frame: call.callee_frame, frameScale: call.callee_frame_scale, gender: call.callee_gender };
  const myGender = role === 'callee' ? call.callee_gender : call.caller_gender;
  // Görüntülü görüşme yalnızca erkek → kadın aramada ücretlidir; her açılışta yeniden sorulur.
  const videoFeeDue = myGender === 'erkek' && other.gender === 'kadın';

  const myId = role === 'callee' ? call.callee_id : call.caller_id;
  // Görüntülü istek durumu: bekleyen istek, isteği yapan taraf ve bu aramada ödenmiş ücret.
  const videoPending = call.video_fee_status === 'pending';
  const videoMine = !!call.video_fee_by && call.video_fee_by === myId;
  const videoRejected = call.video_fee_status === 'rejected' && videoMine;
  const videoPaid = call.video_fee_paid === true;
  const requesterName = call.video_fee_by === call.caller_id ? call.caller_name : call.callee_name;

  const pressVideo = () => {
    // Açıkken kapatmak ücretsizdir; bu aramada ücret ödendiyse yeniden coin istenmez.
    if (cameraOn) { toggleCamera(); return; }
    if (videoPending && videoMine) return;
    if (videoFeeDue && !videoPaid) { setFeeAsk(true); return; }
    startVideo();
  };

  // İstek karşı tarafa iletilir: kabul ederse 3.000 coin gönderilir, reddederse hiç coin kesilmez.
  const confirmVideoFee = async () => {
    setFeeAsk(false);
    await startVideo();
  };

  const statusText = phase === 'active'
    ? formatDuration(seconds)
    : phase === 'incoming'
      ? 'Sesli arama isteği'
      : 'Bağlanıyor...';

  const remoteVideoVisible = phase === 'active' && remoteCameraOn && !!remoteVideoTrack;
  const showStage = phase !== 'incoming' && (remoteVideoVisible || (cameraOn && !!localVideoTrack));

  if (minimized && phase !== 'incoming') return <CallBubble avatar={other.avatar} name={other.name} muted={remoteMuted} onOpen={restoreCall} />;

  return (
    <section className="fixed inset-0 z-[230] flex flex-col bg-catalog text-primary-foreground" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-primary/25 to-transparent" />
      {phase !== 'incoming' && <button type="button" aria-label="Aramayı küçült ve ana ekrana dön" onClick={() => { minimizeCall(); navigate('/'); }} className="absolute left-4 z-10 rounded-full bg-secondary p-3 text-secondary-foreground" style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}><ArrowLeft className="h-6 w-6" /></button>}
      <p className="relative pt-10 text-center text-[11px] uppercase tracking-[0.35em] text-white/50">
        {phase === 'incoming' ? 'Gelen arama' : phase === 'outgoing' ? 'Aranıyor' : showStage ? 'Görüntülü arama' : 'Sesli arama'}
      </p>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6">
        {showStage ? (
          <div className="relative h-full w-full self-stretch overflow-hidden rounded-3xl bg-catalog">
            {remoteVideoVisible
              ? <CallVideoTile track={remoteVideoTrack} className="h-full w-full object-cover" />
              : <CallVideoTile track={localVideoTrack} mirror={facing === 'user'} className="h-full w-full object-cover" />}
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              <span className="font-semibold">{other.name || 'Kullanıcı'}</span>
              {statusText && phase === 'active' && <span className="font-mono text-white/70">{statusText}</span>}
              {remoteMuted && <MicOff className="h-3.5 w-3.5 text-red-400" />}
            </div>
            {remoteVideoVisible && cameraOn && localVideoTrack && (
              <div className="absolute right-3 top-3 h-32 w-24 overflow-hidden rounded-2xl border border-white/25 bg-black shadow-lg">
                <CallVideoTile track={localVideoTrack} mirror={facing === 'user'} className="h-full w-full object-cover" />
              </div>
            )}
            {/* Ön/arka kamera geçişi */}
            {cameraOn && (
              <button
                type="button"
                onClick={switchCamera}
                aria-label="Ön/arka kamerayı değiştir"
                title="Kamerayı çevir"
                className="absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-md active:scale-95"
              >
                <SwitchCamera className="h-6 w-6" />
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="relative">
              {phase !== 'active' && <span className={`absolute inset-0 rounded-full animate-ping ${phase === 'incoming' ? 'bg-green-500/25' : 'bg-white/15'}`} />}
              {other.frame
                ? <ProfileFrame frame={other.frame} avatar={other.avatar} name={other.name} size="lg" frameScale={other.frameScale} />
                : <XpAvatar avatar={other.avatar} name={other.name} size="lg" />}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold">{other.name || 'Kullanıcı'}</h2>
              <p className={`mt-1 text-sm ${phase === 'active' ? 'font-mono tracking-widest text-white/80' : 'text-white/60'}`}>{statusText}</p>
              {remoteMuted && phase === 'active' && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                  <MicOff className="h-3.5 w-3.5" /> {other.name || 'Karşı taraf'} sessize alındı
                </p>
              )}
            </div>
          </>
        )}
      </div>
      {error && <p className="relative px-6 pb-3 text-center text-xs text-red-400">{error}</p>}
      {videoRejected && <p className="relative px-6 pb-2 text-center text-xs text-amber-400">Görüntülü istek reddedildi — coin gönderilmedi.</p>}
      {videoPending && videoMine && (
        <div className="relative mx-auto mb-3 flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-4 py-2 text-xs text-white/85">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>{other.name || 'Karşı taraf'} onayı bekleniyor…</span>
          <button type="button" onClick={cancelVideo} className="rounded-full bg-white/10 px-2.5 py-1 font-bold text-white active:scale-95">Vazgeç</button>
        </div>
      )}

      {videoPending && !videoMine ? (
        <div className="relative mx-auto mb-4 w-full max-w-[440px] shrink-0 rounded-3xl border border-primary/40 bg-black/60 px-5 py-4 text-center">
          <p className="text-sm font-bold text-white">{requesterName || 'Karşı taraf'} görüntülü görüşme istiyor</p>
          <p className="mt-1 text-[11px] leading-snug text-white/70">
            Kabul edersen görüntülü görüşme için 3.000 coin gönderilir ve elmaslarına eklenir.
          </p>
          <div className="mt-4 flex items-center justify-center gap-10">
            <CallCircleButton tone="red" onClick={() => answerVideo(false)} label="Reddet"><PhoneOff className="h-7 w-7" /></CallCircleButton>
            <CallCircleButton tone="green" onClick={() => answerVideo(true)} label="Kabul et" pulsing><Video className="h-7 w-7" /></CallCircleButton>
          </div>
        </div>
      ) : (
      <div className="relative flex shrink-0 items-center justify-center gap-4 pb-12 sm:gap-9">
        {phase === 'incoming' ? (
          <>
            <CallCircleButton tone="red" onClick={rejectCall} label="Reddet"><PhoneOff className="h-7 w-7" /></CallCircleButton>
            <CallCircleButton tone="green" onClick={acceptCall} label="Kabul et" pulsing><Phone className="h-7 w-7" /></CallCircleButton>
          </>
        ) : (
          <>
            <CallCircleButton tone="gray" onClick={toggleMute} label={muted ? 'Sesi aç' : 'Sessiz'}>
              {muted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
            </CallCircleButton>
            <CallCircleButton tone={cameraOn ? 'green' : 'gray'} onClick={pressVideo} label={cameraOn ? 'Kamerayı kapat' : 'Görüntülü'}>
              {cameraOn ? <Video className="h-7 w-7" /> : <VideoOff className="h-7 w-7" />}
            </CallCircleButton>
            <CallCircleButton tone="gray" onClick={toggleSpeaker} label={speaker ? 'Sesi kapat' : 'Sesi aç'}>
              {speaker ? <Volume2 className="h-7 w-7" /> : <VolumeX className="h-7 w-7" />}
            </CallCircleButton>
            <CallCircleButton tone="red" onClick={endCall} label="Kapat"><PhoneOff className="h-7 w-7" /></CallCircleButton>
          </>
        )}
      </div>
      )}
      <ConfirmDialog
        open={feeAsk}
        onOpenChange={setFeeAsk}
        title="Görüntülü görüşme"
        description={`Görüntülü görüşme isteği ${other.name || 'karşı tarafa'} gönderilsin mi? Kabul ederse 3.000 coin gönderilir ve elmaslarına eklenir; reddederse coin kesilmez.`}
        confirmText="İstek gönder"
        onConfirm={confirmVideoFee}
      />
    </section>
  );
}