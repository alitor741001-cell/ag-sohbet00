import '@/components/auth/blueAuth.css';

const ART = {
  login: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/e0f41525d_IMG_0296.jpg',
  register: 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/234a2820f_IMG_0298.jpg',
};

// Tasarım görselinin kendisi ekrandır; çalışan alanlar görseldeki çizimlerin tam üstüne oturur.
export const zone = (x1, y1, x2, y2) => ({ left: `${x1 / 6.82}%`, top: `${y1 / 10.24}%`, width: `${(x2 - x1) / 6.82}%`, height: `${(y2 - y1) / 10.24}%` });

export default function BlueAuthLayout({ mode = 'login', error, notice, children }) {
  return (
    <main className="blue-auth">
      <div className="blue-auth-stage" style={{ backgroundImage: `url(${ART[mode]})` }}>
        {(error || notice) && <div className={`blue-auth-error${error ? '' : ' blue-auth-notice'}`} role={error ? 'alert' : 'status'}>{error || notice}</div>}
        {children}
      </div>
    </main>
  );
}