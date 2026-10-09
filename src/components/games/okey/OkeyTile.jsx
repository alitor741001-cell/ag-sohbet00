import { tileColor, tileLabel } from './okeyConfig';

/** Tek okey taşı: beyaz zemin, renkli sayı ve altında renk biçimi. */
export default function OkeyTile({ tile, size = '', down = false, wild = false, className = '', ...rest }) {
  const classes = ['okey-tile', size && `okey-tile-${size}`, className].filter(Boolean).join(' ');
  if (down) return <span className={`${classes} okey-tile-down`} {...rest} />;
  return (
    <span className={`${classes} okey-tile-c-${tileColor(tile)}${wild ? ' okey-tile-wild' : ''}`} {...rest}>
      <span className="okey-tile-num">{tileLabel(tile)}</span>
      <span className="okey-tile-shape" />
    </span>
  );
}