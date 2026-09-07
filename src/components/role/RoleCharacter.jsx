export default function RoleCharacter({ roleKey, color }) {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ color: color || '#8b5cf6' }}>
      <div className="text-6xl" style={{ animation: 'char-body-breathe 2s ease-in-out infinite' }}>
        {roleKey === 'founder' ? '👑' :
         roleKey === 'queen_admin' ? '❤️' :
         roleKey === 'admin_helper' ? '🔥' :
         roleKey === 'can_ablam' ? '🪔' :
         roleKey === 'can_abim' ? '🦁' :
         roleKey === 'nargileciler' ? '🪔' :
         roleKey === 'special_vip' ? '💰' :
         roleKey === 'prince' ? '💙' :
         roleKey === 'princess' ? '👸' :
         roleKey === 'vip1' ? '💎' :
         roleKey === 'vip2' ? '💜' :
         roleKey === 'vip3' ? '🌟' :
         '✨'}
      </div>
    </div>
  );
}