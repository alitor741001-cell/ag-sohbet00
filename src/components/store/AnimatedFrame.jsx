import { Star, Sparkles } from 'lucide-react';
import { Image } from '@/components/ui/image';
import '@/components/store/animatedFrames.css';
export default function AnimatedFrame({ frame, source, className = '', ...props }) {
  const image = <Image src={source} alt="" fittingType="fit" className="ag-frame-art absolute inset-0 h-full w-full object-contain" draggable={false} />;
  return <span {...props} role="img" aria-label={frame.name} className={`ag-frame ag-frame--${frame.family} relative inline-block ${className}`} style={{ ...props.style, '--frame-glow': frame.glow }}>
    {frame.family === 'duality' ? <><span className="ag-frame-left absolute inset-0">{image}</span><span className="ag-frame-right absolute inset-0">{image}</span></> : image}
    {frame.family === 'star' && <span className="ag-frame-orbit absolute inset-[8%]"><Star className="ag-frame-comet absolute left-1/2 top-0 h-[11%] w-[11%] -translate-x-1/2" fill="currentColor" /><span className="ag-frame-tail absolute left-1/2 top-0 h-[3%] w-[23%] rounded-full" /></span>}
    {['butterfly', 'flower'].includes(frame.family) && <><Sparkles className="ag-frame-spark absolute left-[12%] top-[20%] h-[8%] w-[8%]" /><Sparkles className="ag-frame-spark ag-frame-spark-late absolute bottom-[14%] right-[18%] h-[6%] w-[6%]" /></>}
  </span>;
}