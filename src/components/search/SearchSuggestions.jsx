import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function SearchSuggestions({ query, onSelect }) {
  const [results, setResults] = useState([]);
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      base44.entities.Movie.filter({ published: true }, '-views', 10).then((all) => {
        const ql = query.toLowerCase();
        setResults(all.filter((m) => m.title?.toLowerCase().includes(ql)).slice(0, 5));
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  if (!show || !query || results.length === 0) return null;

  return (
    <div ref={ref} className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-[#16161e] border border-white/10 shadow-2xl overflow-hidden z-50">
      {results.map((m) => (
        <button key={m.id} onClick={() => { setShow(false); onSelect(); navigate(`/izle/${m.id}`); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-left">
          <span className="text-sm text-white truncate">{m.title}</span>
        </button>
      ))}
    </div>
  );
}