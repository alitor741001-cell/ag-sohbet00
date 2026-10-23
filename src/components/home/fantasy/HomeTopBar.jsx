import { Link } from 'react-router-dom';

export const DESIGN_IMG = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/5c0f0c906_IMG_0140.jpg';
const HIT = 'absolute top-[18%] h-[64%] rounded-full active:bg-white/10';

/** Ana sayfa üst şeridi: kullanıcının gönderdiği tasarım görseli birebir kullanılır,
    butonlar görseldeki yerlerinin üzerinde görünmez dokunma alanlarıdır. */
export default function HomeTopBar({ view = 'hot', onView, onSearch }) {
  return (
    <div className="sticky top-0 z-40 -mx-4 mb-3 sm:-mx-6" style={{ aspectRatio: '682 / 110', backgroundImage: `url(${DESIGN_IMG})`, backgroundSize: '100% auto', backgroundPosition: 'top', backgroundRepeat: 'no-repeat' }}>
      <button type="button" aria-label="Sıcak" aria-pressed={view === 'hot'} onClick={() => onView?.('hot')} className={HIT} style={{ left: '3%', width: '19.5%' }} />
      <button type="button" aria-label="Takip" aria-pressed={view === 'history'} onClick={() => onView?.('history')} className={HIT} style={{ left: '23.5%', width: '17.5%' }} />
      <button type="button" aria-label="Üye numarasıyla ara" onClick={onSearch} className={HIT} style={{ left: '61.3%', width: '8.8%' }} />
      <Link to="/oda-kur" aria-label="Oda Kur" className={HIT} style={{ left: '71.8%', width: '21%' }} />
    </div>
  );
}