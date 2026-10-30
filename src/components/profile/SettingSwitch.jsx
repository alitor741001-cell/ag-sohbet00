/** Film odası yönetici panelindeki gibi anahtar: kapalıyken beyaz topuz solda, açıkken sağa kayar — açıkken yeşil, kapalıyken kırmızı. */
export default function SettingSwitch({ checked, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 overflow-hidden rounded-full transition-colors disabled:opacity-40 ${checked ? 'bg-green-500' : 'bg-red-500'}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-out ${checked ? 'translate-x-[20px]' : 'translate-x-0'}`}
      />
    </button>
  );
}