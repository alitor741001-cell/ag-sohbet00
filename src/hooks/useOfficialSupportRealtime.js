import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useCurrentUser } from '@/lib/useCurrentUser';
import isMessageNotification from '@/lib/messageNotification';

export default function useOfficialSupportRealtime(ticketId) {
  const client = useQueryClient();
  const { user } = useCurrentUser();
  useEffect(() => {
    if (!user?.id) return;
    let timer;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        client.invalidateQueries({ queryKey: ['official-tickets'] });
        client.invalidateQueries({ queryKey: ['support-unread', user.id] });
        if (ticketId) client.invalidateQueries({ queryKey: ['official-messages', ticketId] });
      }, 80);
    };
    const offNotification = subscribeEntity('Notification', event => {
      if (event.data?.user_id === user.id && isMessageNotification(event.data) && event.data?.type !== 'dm') refresh();
    });
    const offTicket = subscribeEntity('SupportTicket', refresh);
    const offMessage = subscribeEntity('SupportMessage', event => {
      if (!ticketId || event.data?.ticket_id === ticketId) refresh();
    });
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', visible);
    return () => { clearTimeout(timer); offNotification(); offTicket(); offMessage(); window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', visible); };
  }, [client, user?.id, ticketId]);
}