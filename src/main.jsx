// Yayındaki son çalışan paketi yükler.
const recoveryScript = document.createElement('script');
recoveryScript.type = 'module';
recoveryScript.src = '/functions/recoveryBundle';
recoveryScript.onerror = () => {
  document.getElementById('root').innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;background:#09090b;color:#fff;font-family:sans-serif">Uygulama kurtarma paketi yüklenemedi.</main>';
};
document.head.appendChild(recoveryScript);