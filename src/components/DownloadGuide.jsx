import { useState } from 'react';
import { Smartphone, Apple, Chrome, Share, Plus, X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

export default function DownloadGuide({ platform, variant = 'light', onClose }) {
  const [step, setStep] = useState(0);
  const isAndroid = platform === 'android';
  const steps = isAndroid ? [
    { title: 'Tarayıcı menüsünü açın', desc: 'Sağ üst köşedeki üç nokta simgesine dokunun.' },
    { title: 'Ana ekrana ekle seçeneğini seçin', desc: 'Açılan menüden "Ana ekrana ekle" seçeneğine dokunun.' },
    { title: 'Onaylayın', desc: '"Ekle" butonuna basarak ana ekrana ekleyin.' },
  ] : [
    { title: 'Paylaş butonuna dokunun', desc: 'Safari\'nin altındaki Paylaş simgesine dokunun.' },
    { title: 'Ana Ekrana Ekle seçeneğini seçin', desc: 'Açılan menüden "Ana Ekrana Ekle" seçeneğine dokunun.' },
    { title: 'Onaylayın', desc: '"Ekle" butonuna basarak ana ekrana ekleyin.' },
  ];

  const light = variant === 'light';
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: light ? '#16161e' : '#16161e', border: '1px solid rgba(168,85,247,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {isAndroid ? <Smartphone className="w-5 h-5 text-purple-400" /> : <Apple className="w-5 h-5 text-purple-400" />}
            Kurulum Rehberi
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            {step > 0 && <button onClick={() => setStep(step - 1)} className="text-gray-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>}
            <div className="flex gap-1.5 mx-auto">
              {steps.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-purple-500' : 'bg-white/20'}`} />)}
            </div>
            {step < steps.length - 1 && <button onClick={() => setStep(step + 1)} className="text-gray-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>}
          </div>
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'rgba(168,85,247,0.15)' }}>
              {step === 0 && (isAndroid ? <Smartphone className="w-8 h-8 text-purple-400" /> : <Share className="w-8 h-8 text-purple-400" />)}
              {step === 1 && (isAndroid ? <Plus className="w-8 h-8 text-purple-400" /> : <Plus className="w-8 h-8 text-purple-400" />)}
              {step === 2 && <Check className="w-8 h-8 text-green-400" />}
            </div>
            <h4 className="text-lg font-bold text-white mb-2">{steps[step].title}</h4>
            <p className="text-sm text-gray-400">{steps[step].desc}</p>
          </div>
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #6b21a8)' }}>İleri</button>
          ) : (
            <button onClick={onClose} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #6b21a8)' }}>Tamamlandı</button>
          )}
        </div>
      </div>
    </div>
  );
}