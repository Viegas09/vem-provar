import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { C, FONT } from "../theme";
import { fetchOrderMessages, sendOrderMessage } from "../data/queries";

const POLL_MS = 5000;

export default function OrderChat({ orderId, sender, emptyLabel }) {
  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchOrderMessages(orderId);
        if (!cancelled) {
          setMessages(data);
          setLoaded(true);
        }
      } catch {
        // mantém a última versão carregada; tenta de novo no próximo poll
      }
    }

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    try {
      const saved = await sendOrderMessage(orderId, sender, body);
      setMessages((prev) => [...prev, saved]);
      fetch("/api/send-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, sender, body }),
      }).catch(() => {});
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden" }}>
      <div ref={listRef} style={{ maxHeight: 280, minHeight: 120, overflowY: "auto", padding: 14,
           display: "flex", flexDirection: "column", gap: 8, background: C.surface }}>
        {!loaded ? (
          <span style={{ fontSize: 13, color: C.grayText, textAlign: "center", padding: "20px 0" }}>Carregando…</span>
        ) : messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "20px 0" }}>
            <MessageCircle size={22} color={C.grayText} />
            <span style={{ fontSize: 13, color: C.grayText, textAlign: "center" }}>
              {emptyLabel || "Nenhuma mensagem ainda."}
            </span>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender === sender;
            return (
              <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                <div style={{ background: mine ? C.orange : "#fff", color: mine ? "#fff" : C.black,
                     border: mine ? "none" : `1px solid ${C.line}`, borderRadius: 14,
                     borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4,
                     padding: "9px 13px", fontSize: 14, lineHeight: 1.4 }}>
                  {m.body}
                </div>
                <div style={{ fontSize: 10.5, color: C.grayText, marginTop: 3, textAlign: mine ? "right" : "left" }}>
                  {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={handleSend} className="flex items-center gap-2" style={{ padding: 10, background: "#fff", borderTop: `1px solid ${C.line}` }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva uma mensagem…"
          style={{ flex: 1, border: `1.5px solid ${C.line}`, outline: "none", borderRadius: 10, padding: "9px 12px",
                   fontFamily: FONT, fontSize: 14, background: "transparent" }} />
        <button type="submit" disabled={!text.trim() || sending}
          style={{ width: 38, height: 38, borderRadius: 10, border: "none", flexShrink: 0,
                   background: text.trim() && !sending ? C.orange : C.gray, color: "#fff",
                   cursor: text.trim() && !sending ? "pointer" : "default", display: "grid", placeItems: "center" }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
