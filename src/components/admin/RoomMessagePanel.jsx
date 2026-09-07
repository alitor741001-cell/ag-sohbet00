import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import UserBadge from '@/components/admin/UserBadge';
import { Trash2, Send, Crown, Download, Copy, MoreVertical, ArrowLeft, X } from 'lucide-react';

export default function RoomMessagePanel({
  active, owner, messages, msgProfiles, participantProfiles,
  tab, setTab, input, setInput, send,
  menuMsg, setMenuMsg, setConfirm, setConfirmAll,
  exportMessages, copyRoomNo, roomNo, onClose, isMobile, scrollRef
}) {
  if (!active) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8">Görüntülemek için bir oda seçin.</div>;
  }

  return (
    <>
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          {isMobile && (
            <button onClick={onClose} className="shrink-0 p-1.5 -ml-1 rounded-lg hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Link to={`/kullanici/${active.owner_id}`} className="shrink-0">
            {owner?.avatar ? (
              <Image src={owner.avatar} className="w-10 h-10 rounded-full object-cover" fittingType="fill" />
            ) : (
              <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold">
                {(active.owner_name || '?')[0]}
              </span>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold truncate text-sm">{active.name}</p>
              <button onClick={copyRoomNo} className="text-muted-foreground hover:text-foreground shrink-0">
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {roomNo} • {active.owner_name || '-'} •{' '}
              <span className={active.status === 'active' ? 'text-green-400' : 'text-red-400'}>
                {active.status === 'active' ? 'Aktif' : 'Kapalı'}
              </span>
            </p>
          </div>
          {isMobile && (
            <button onClick={onClose} className="shrink-0 p-1.5 rounded-lg hover:bg-secondary">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        <TabButton active={tab === 'messages'} onClick={() => setTab('messages')}>
          Mesajlar{messages.length > 0 && <span className="ml-1 text-xs text-muted-foreground">({messages.length})</span>}
        </TabButton>
        <TabButton active={tab === 'participants'} onClick={() => setTab('participants')}>
          Katılımcılar ({active.participants?.length || 0})
        </TabButton>
        <TabButton active={tab === 'info'} onClick={() => setTab('info')}>
          Oda Bilgileri
        </TabButton>
      </div>

      {/* Content */}
      {tab === 'participants' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0 overscroll-contain">
          {(active.participants || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Katılımcı yok.</p>
          ) : (
            (active.participants || []).map((p) => {
              const prof = participantProfiles[p.user_id];
              return (
                <div key={p.user_id} className="p-2 rounded-lg hover:bg-secondary/40">
                  <UserBadge userId={p.user_id} name={p.name} avatar={p.avatar || prof?.avatar} memberId={prof?.member_id} size="md" isOwner={p.user_id === active.owner_id} />
                </div>
              );
            })
          )}
        </div>
      ) : tab === 'info' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0 overscroll-contain">
          <DetailRow label="Oda Adı" value={active.name} />
          <DetailRow label="Oda Numarası" value={roomNo} />
          <DetailRow label="Oda Sahibi" value={active.owner_name || '-'} />
          <DetailRow label="Film" value={active.movie_title || '-'} />
          <DetailRow label="Durum" value={active.status === 'active' ? 'Aktif' : 'Kapalı'} />
          <DetailRow label="Katılımcı" value={`${active.participants?.length || 0}/${active.max_users || 10}`} />
          <DetailRow label="Şifreli" value={active.password ? 'Evet' : 'Hayır'} />
          <DetailRow label="Sohbet" value={active.chat_enabled ? 'Açık' : 'Kapalı'} />
          <DetailRow label="Sesli" value={active.voice_enabled ? 'Açık' : 'Kapalı'} />
          <DetailRow label="Oluşturulma" value={new Date(active.created_date).toLocaleString('tr-TR')} />
          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={exportMessages} className="inline-flex items-center gap-1.5 bg-secondary px-3 py-2 rounded-lg text-sm font-semibold">
              <Download className="w-4 h-4" /> Dışa Aktar
            </button>
            {messages.length > 0 && (
              <button onClick={() => setConfirmAll(true)} className="inline-flex items-center gap-1.5 bg-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm font-semibold">
                <Trash2 className="w-4 h-4" /> Tümünü Sil
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-0 overscroll-contain" onClick={() => menuMsg && setMenuMsg(null)}>
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Mesaj yok.</p>
            ) : (
              messages.map((m) => (
                m.type === 'system' ? (
                  <div key={m.id} className="flex items-center justify-center gap-1.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="text-xs text-muted-foreground text-center">{m.text}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(m.created_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-2.5 group relative">
                    <Link to={`/kullanici/${m.user_id}`} className="shrink-0">
                      {(m.user_avatar || msgProfiles[m.user_id]?.avatar) ? (
                        <Image src={m.user_avatar || msgProfiles[m.user_id]?.avatar} className="w-8 h-8 rounded-full object-cover" fittingType="fill" />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold">
                          {(m.user_name || '?')[0]}
                        </span>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/kullanici/${m.user_id}`} className="text-sm font-semibold text-primary hover:underline">
                          {m.user_name}
                        </Link>
                        {m.user_id === active.owner_id && <Crown className="w-3 h-3 text-amber-400" />}
                        {msgProfiles[m.user_id]?.member_id && (
                          <span className="text-xs text-muted-foreground">#{msgProfiles[m.user_id].member_id}</span>
                        )}
                      </div>
                      <p className="text-sm mt-0.5 break-words">{m.text}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 self-start mt-1">
                      {new Date(m.created_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="relative shrink-0">
                      <button onClick={() => setMenuMsg(menuMsg === m.id ? null : m.id)} className="p-1 rounded hover:bg-secondary text-muted-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuMsg === m.id && (
                        <div className="absolute right-0 top-7 z-20 bg-popover border border-border rounded-lg shadow-xl py-1 w-32">
                          <button onClick={() => { setConfirm(m); setMenuMsg(null); }} className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-1.5">
                            <Trash2 className="w-3 h-3" /> Sil
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              ))
            )}
          </div>
          {/* Input */}
          <div className="p-3 border-t border-border shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-2 bg-secondary/60 rounded-full pl-4 pr-1.5 py-1.5 border border-border focus-within:ring-2 focus-within:ring-ring">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send(); if (e.key === 'Escape') setMenuMsg(null); }}
                placeholder="Mesaj yazın..."
                className="flex-1 bg-transparent text-sm outline-none min-w-0"
              />
              <button onClick={send} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`flex-1 py-2.5 text-sm font-medium relative ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
      {children}
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
    </button>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm py-2 border-b border-border last:border-0 gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right break-words">{value}</span>
    </div>
  );
}