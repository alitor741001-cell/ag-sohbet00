import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X } from 'lucide-react';

export default function LiveChatButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate('/admin/destek')} className="relative p-2 rounded-full hover:bg-white/5 transition-colors" title="Canlı Destek">
        <MessageCircle className="w-5 h-5 text-white/60" />
      </button>
    </>
  );
}