import { Link } from 'react-router-dom';
import { HOME_DESIGN } from '@/components/layout/HomeImageNav';

const zone = (left, width) => ({ left: `${left}%`, width: `${width}%` });

/** Ana sayfa üst şeridi: gönderilen tasarımın üst bandı birebir, üstünde görünmez dokunma alanları. */
export default function HomeTopBar({ onView, onSearch, showViews = true }) {
  return (
    <>
    {/* Yer tutucu: sabit şeridin altında içerik kaymasın. */}
    {/* Güvenli alan boşluğu ana yerleşimde zaten veriliyor: burada tekrarlanmaz,
        yoksa kart listesi şeridin çok altında kalır. */}
    <div aria-hidden="true" className="mb-1"><div className="w-[100vw] max-w-[36rem]" style={{ aspectRatio: '682 / 112' }} /></div>
    <div className="fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)]" style={{ background: 'transparent' }}>
      <div className="relative mx-auto w-full max-w-[36rem]" style={{ aspectRatio: '682 / 112', backgroundImage: `url(${HOME_DESIGN})`, backgroundSize: '100% auto', backgroundPosition: 'center top' }}>
        {showViews && <button type="button" aria-label="Sıcak" onClick={() => onView?.('hot')} className="absolute inset-y-[15%] rounded-full" style={zone(3, 19.5)} />}
        {showViews && <button type="button" aria-label="Takip" onClick={() => onView?.('history')} className="absolute inset-y-[15%] rounded-full" style={zone(23.5, 17.5)} />}
        <button type="button" aria-label="Üye numarasıyla ara" onClick={onSearch} className="absolute inset-y-[15%] rounded-full" style={zone(61, 9.5)} />
        <Link to="/oda-kur" aria-label="Oda Kur" className="absolute inset-y-[15%] rounded-full" style={zone(71.5, 21.5)} />
      </div>
    </div>
    </>
  );
}