import { getRoleInfo } from '@/lib/roles';

export default function RoleBadge({ user, size = 'sm' }) {
  if (!user) return null;
  const roleInfo = getRoleInfo(user);
  if (!roleInfo?.label) return null;

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold border ${sizeClasses[size]}`}
      style={{
        color: roleInfo.color,
        borderColor: `${roleInfo.color}50`,
        backgroundColor: `${roleInfo.color}15`,
      }}
    >
      {roleInfo.label}
    </span>
  );
}