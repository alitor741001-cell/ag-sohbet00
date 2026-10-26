import { useEffect, useRef } from 'react';
import SupportChatMessage from '@/components/support/SupportChatMessage';
import SupportComposer from '@/components/support/SupportComposer';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SupportMemberIdentity from '@/components/support/SupportMemberIdentity';
const call = async payload => (await base44.functions.invoke('officialSupport', payload)).data;
export default function OfficialThread({ ticket, onClosed, onCloseTopic, closing }) {
  const end = useRef(null);
  const client = useQueryClient();
  const messages = useInfiniteQuery({ queryKey: ['official-messages', ticket.id], initialPageParam: undefined,
    queryFn: ({ pageParam }) => call({ action: 'messages', ticket_id: ticket.id, cursor: pageParam }),
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined, refetchInterval: 5000 });
  useEffect(() => { if ([403, 404, 410].includes(messages.error?.response?.status)) { client.invalidateQueries({ queryKey: ['official-tickets'] }); onClosed(); } }, [messages.error, client, onClosed]);
  const mutation = useMutation({ mutationFn: payload => call({ action: 'reply', ticket_id: ticket.id, ...payload }),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['official-tickets'] }); client.invalidateQueries({ queryKey: ['official-messages', ticket.id] }); } });
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [messages.data?.pages[0]?.items[0]?.id]);
  const send = async payload => { try { await mutation.mutateAsync(payload); return true; } catch { return false; } };
  return <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
    <header className="support-member-strip"><SupportMemberIdentity ticket={ticket} onCloseTopic={onCloseTopic} /></header>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5" aria-live="polite">
      {messages.isPending && <p className="support-chat-muted text-sm">Yükleniyor...</p>}{messages.isError && <p role="alert" className="text-sm text-destructive">Mesajlar alınamadı.</p>}
      {messages.hasNextPage && <button onClick={() => messages.fetchNextPage()} disabled={messages.isFetchingNextPage} className="support-chat-muted mb-4 w-full text-xs">Eski mesajları yükle</button>}
      {messages.data?.pages.flatMap(page => page.items).reverse().map(message => <SupportChatMessage key={message.id} message={message} viewer="admin" memberName={ticket.user_name || 'Üye'} memberAvatar={ticket.user_avatar} />)}
      <div ref={end} />
    </div>
    {mutation.isError && <p role="alert" className="px-4 py-2 text-xs text-destructive">{mutation.error.response?.data?.error || 'Mesaj gönderilemedi.'}</p>}
    <SupportComposer busy={mutation.isPending || closing} onSendText={text => send({ text })} onSendMedia={(file_url, media_type) => send({ text: '', file_url, media_type })} />
  </div>;
}