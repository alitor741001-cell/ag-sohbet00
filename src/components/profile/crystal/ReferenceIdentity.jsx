import { Copy, Diamond, Heart } from 'lucide-react';

export default function ReferenceIdentity({ name, age, gender, agency, memberId, vipLevel, nLevel, giftSentLevel, giftReceivedLevel, country, flag, onCopyId }) {
  return <div className="reference-identity">
    <div className="reference-name-row"><Diamond className="reference-diamond" /><strong>{name}</strong><Diamond className="reference-diamond" />
      {!!age && <span className="reference-age">{gender === 'erkek' ? '♂' : '♀'}{age}</span>}
      {agency && <span className="reference-agency">{agency}</span>}
    </div>
    <div className="reference-id-row"><button type="button" onClick={onCopyId} aria-label="Kullanıcı kimliğini kopyala">ID:{memberId || '—'} <Copy /></button><span>{flag || '🇹🇷'} {country || 'TUR'}</span></div>
    <div className="reference-level-row"><span className="reference-vip">VIP{vipLevel}</span><span className="reference-level">N {nLevel}</span><span className="reference-sent">✦ {giftSentLevel}</span><span className="reference-received"><Heart /> {giftReceivedLevel}</span></div>
  </div>;
}