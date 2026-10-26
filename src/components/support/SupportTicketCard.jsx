import { ChevronRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
export default function SupportTicketCard({ ticket, onSelect }) {
  const time = ticket.last_message_at || ticket.created_date;
  return <button type="button" onClick={onSelect} className="support-ticket" aria-label={`${ticket.user_name || 'Üye'} görüşmesini aç`}>
    {ticket.user_avatar ? <Image src={ticket.user_avatar} alt="" className="support-ticket-avatar" /> : <span className="support-ticket-avatar flex items-center justify-center text-xl font-bold">{(ticket.user_name || 'Ü')[0]}</span>}
    <div className="min-w-0 flex-1"><p className="break-words text-sm font-bold">{ticket.user_name || 'Üye'} <span className="support-chat-online ml-1 text-xs" title="Görüşme açık">●</span></p><span className="support-chat-muted text-[10px]">Üye · ID: {ticket.member_id || '—'}</span>
      <div className="support-preview"><p className="whitespace-pre-wrap text-sm">{ticket.last_message || ticket.subject}</p><time className="support-chat-muted mt-1 block text-[10px]">{time ? new Date(time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}</time></div>
    </div><ChevronRight className="support-chat-muted mt-2 h-5 w-5 shrink-0" />
  </button>;
}