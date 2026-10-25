import { Eye, EyeOff } from 'lucide-react';

export default function BlueAuthField({ id, label, icon: Icon, shown, onToggle, ...props }) {
  return (
    <div className="blue-auth-field">
      <label htmlFor={id} className="sr-only">{label}</label>
      {Icon && <Icon aria-hidden="true" className="blue-auth-field-icon" />}
      <input id={id} placeholder={label} {...props} />
      {onToggle && <button type="button" onClick={onToggle} className="blue-auth-eye" aria-label={shown ? 'Şifreyi gizle' : 'Şifreyi göster'} aria-pressed={shown}>
        {shown ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>}
    </div>
  );
}