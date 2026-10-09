/** Istokoz ortasındaki marka yazısı: tahtaya işlenmiş gibi iki satır hâlinde durur. */
export default function OkeyBoardBrand({ variant = 'okey101' }) {
  return (
    <span className="okey-brand" aria-hidden="true">
      <span className="okey-brand-main">{variant === 'okey' ? 'OKEY' : '101 OKEY'}</span>
      <span className="okey-brand-sub">AG</span>
    </span>
  );
}