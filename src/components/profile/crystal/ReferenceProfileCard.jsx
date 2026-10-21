import { X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import ReferencePortrait from '@/components/profile/crystal/ReferencePortrait';
import ReferenceIdentity from '@/components/profile/crystal/ReferenceIdentity';
import ReferenceActions from '@/components/profile/crystal/ReferenceActions';
import '@/components/profile/crystal/reference-profile.css';

const ART = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/e5ec1e1a5_generated_image.png';

export default function ReferenceProfileCard({
  name, avatar, nLevel = 0, vipLevel = 0, giftSentLevel = 0, giftReceivedLevel = 0,
  memberId, age, gender, agency, country, flag, actions = {}, followNode, self, onClose, onCopyId,
}) {
  return <section className="reference-card" aria-label={`${name} profil kartı`}>
    <Image src={ART} alt="" className="reference-art" fittingType="fill" />
    <button type="button" className="reference-dismiss" onClick={onClose} aria-label="Profil kartını kapat"><X /></button>
    <ReferencePortrait avatar={avatar} name={name} />
    <span className="reference-vip-ribbon">VIP{vipLevel}</span>
    <ReferenceIdentity {...{ name, age, gender, agency, memberId, vipLevel, nLevel, giftSentLevel, giftReceivedLevel, country, flag, onCopyId }} />
    <span className="reference-badges-label">Rozetler:</span>
    <ReferencePortrait avatar={avatar} name={name} small />
    <span className="reference-romance-caption">Aşk için bekliyor</span>
    <ReferenceActions {...{ self, followNode, actions }} />
  </section>;
}