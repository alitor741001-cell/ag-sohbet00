export const SUPPORT_AVATAR_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a38a234ce_generated_image.png';

/** Canlı destek düğmesinin görseli: yönetici paneli ve kullanıcı tarafı aynı düğmeyi kullanır. */
export default function SupportAvatarButton({ onClick, badge = 0, pulse = false, title = 'Canlı Sohbet' }) {
  return (
    <>
      <style>{`@keyframes support-scale-in { from { transform: scale(0); } to { transform: scale(1); } }`}</style>
      <button
        onClick={onClick}
        className={`relative w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 transition-all ${pulse ? 'border-red-500 animate-pulse' : 'border-purple-500/40 hover:border-purple-400'}`}
        style={{ boxShadow: pulse ? '0 0 14px rgba(239,68,68,0.6)' : '0 0 8px rgba(124,58,237,0.3)' }}
        title={title}
      >
        <img src={SUPPORT_AVATAR_URL} alt={title} className="w-full h-full object-cover" />
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-white animate-[support-scale-in_.3s_ease-out]">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>
    </>
  );
}