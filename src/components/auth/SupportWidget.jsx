import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Headset, Send, X, Loader2, Image as ImageIcon } from "lucide-react";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [ticketId, setTicketId] = useState(() => localStorage.getItem("guest_ticket_id") || "");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  const poll = async (tid) => {
    const id = tid || ticketId;
    if (!id) return;
    try {
      const res = await base44.functions.invoke("guest-support", { action: "poll", ticket_id: id });
      if (res.ticket_status === "closed") {
        localStorage.removeItem("guest_ticket_id");
        setTicketId("");
        setMessages([]);
        return;
      }
      // Sadece sunucudan mesaj geldiyse güncelle — optimistic mesajlar silinmesin
      if (res.messages && res.messages.length > 0) {
        setMessages(res.messages);
      }
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {}
  };

  useEffect(() => {
    if (open && ticketId) poll();
  }, [open, ticketId]);

  useEffect(() => {
    if (!open || !ticketId) return;
    const interval = setInterval(() => poll(), 4000);
    return () => clearInterval(interval);
  }, [open, ticketId]);

  const sendFirst = async (msgText, fileUrl) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("guest-support", {
        action: "create", text: msgText || "📷 Fotoğraf", file_url: fileUrl || ""
      });
      localStorage.setItem("guest_ticket_id", res.ticket_id);
      setTicketId(res.ticket_id);
      setTimeout(() => poll(res.ticket_id), 500);
    } catch {
      setError("Mesaj gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg || loading) return;
    setMessages((p) => [...p, { id: "temp-" + Date.now(), sender: "user", text: msg }]);
    setText("");
    if (!ticketId) {
      await sendFirst(msg);
    } else {
      try {
        await base44.functions.invoke("guest-support", { action: "send", ticket_id: ticketId, text: msg });
      } catch {
        setError("Mesaj gönderilemedi");
      }
    }
  };

  const onPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = "";
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      setMessages((p) => [...p, { id: "temp-" + Date.now(), sender: "user", text: "📷 Fotoğraf", file_url }]);
      if (!ticketId) {
        await sendFirst("", file_url);
      } else {
        await base44.functions.invoke("guest-support", { action: "send", ticket_id: ticketId, text: "📷 Fotoğraf", file_url });
      }
    } catch {
      setError("Fotoğraf yüklenemedi");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-[#e50914] hover:bg-[#f6121d] text-white shadow-lg shadow-red-900/50 flex items-center justify-center transition-transform hover:scale-110"
        title="Canlı Destek"
      >
        {open ? <X className="w-6 h-6" /> : <Headset className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[340px] max-w-[calc(100vw-2.5rem)] bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl flex flex-col" style={{ height: "440px" }}>
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#e50914] flex items-center justify-center">
              <Headset className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Canlı Destek</p>
              <p className="text-[10px] text-green-400">● Çevrimiçi</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 overscroll-contain">
            {messages.length === 0 && (
              <p className="text-xs text-[#a0a0a0] text-center mt-4 px-2">
                Merhaba! Sorunuz mu var? Direkt mesaj yazabilir veya fotoğraf gönderebilirsiniz.
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.sender === "user" ? "bg-[#e50914] text-white" : "bg-[#2a2a2a] text-white"}`}>
                  {m.file_url ? (
                    <img src={m.file_url} alt="foto" className="rounded-lg max-w-full max-h-48 object-cover" />
                  ) : m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="border-t border-[#2a2a2a] p-3">
            {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <label className="p-2 rounded-full hover:bg-[#2a2a2a] cursor-pointer shrink-0">
                {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <ImageIcon className="w-5 h-5 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              </label>
              <input
                value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Mesaj yazın..." className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-full px-4 py-2 text-sm text-white placeholder:text-[#555] outline-none focus:border-[#e50914] min-w-0"
              />
              <button type="submit" disabled={loading || uploading} className="p-2.5 rounded-full bg-[#e50914] text-white shrink-0 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}