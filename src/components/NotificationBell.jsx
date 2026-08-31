import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff } from "lucide-react";
import { C, FONT, RADIUS, SHADOW } from "../theme";
import { useAuth } from "../context/AuthContext";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../data/queries";

const POLL_MS = 15000;

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} d`;
}

export default function NotificationBell({ variant = "boxed" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchNotifications(user.id);
        if (!cancelled) setItems(data);
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
  }, [user]);

  if (!user) return null;

  const unreadCount = items.filter((n) => !n.read).length;

  async function handleOpenNotification(n) {
    setOpen(false);
    if (!n.read) {
      setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, read: true } : it)));
      markNotificationRead(n.id).catch(() => {});
    }
    if (n.url) navigate(n.url);
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((it) => ({ ...it, read: true })));
    markAllNotificationsRead(user.id).catch(() => {});
  }

  const boxed = variant === "boxed";

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} aria-label={unreadCount > 0 ? `Notificações, ${unreadCount} não lidas` : "Notificações"}
        className={boxed ? undefined : "flex items-center gap-1"}
        style={boxed
          ? { position: "relative", color: C.black, display: "grid", placeItems: "center", width: 42, height: 42,
              borderRadius: RADIUS.sm, border: `1px solid ${C.line}`, background: "#fff", cursor: "pointer", flexShrink: 0 }
          : { position: "relative", background: "none", border: "none", cursor: "pointer", color: C.black, padding: 0 }}>
        <Bell size={boxed ? 19 : 20} />
        {unreadCount > 0 && (
          <span style={{ position: "absolute", top: boxed ? -6 : -8, right: boxed ? -6 : -10, background: C.orange, color: "#fff",
               fontSize: boxed ? 10 : 11, fontWeight: 700, borderRadius: RADIUS.pill, minWidth: boxed ? 16 : 18, height: boxed ? 16 : 18,
               display: "grid", placeItems: "center", padding: "0 3px" }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 39 }} />
          <div className="vp-dropdown-in" style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 40,
               width: 320, maxWidth: "calc(100vw - 32px)", maxHeight: 420, display: "flex", flexDirection: "column",
               background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.lg,
               boxShadow: SHADOW.md, overflow: "hidden" }}>
            <div className="flex items-center justify-between" style={{ padding: "12px 14px", borderBottom: `1px solid ${C.line}` }}>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>Notificações</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead}
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.orange, fontFamily: FONT,
                           fontSize: 12, fontWeight: 600, padding: 0 }}>
                  Marcar tudo como lido
                </button>
              )}
            </div>
            <div style={{ overflowY: "auto" }}>
              {items.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "32px 16px" }}>
                  <BellOff size={20} color={C.grayText} />
                  <span style={{ fontSize: 12.5, color: C.grayText, textAlign: "center" }}>Nenhuma notificação por enquanto.</span>
                </div>
              ) : (
                items.map((n) => (
                  <button key={n.id} onClick={() => handleOpenNotification(n)}
                    style={{ width: "100%", textAlign: "left", background: n.read ? "#fff" : "rgba(238,108,26,.06)",
                             border: "none", borderBottom: `1px solid ${C.line}`, cursor: "pointer", padding: "12px 14px",
                             display: "flex", gap: 8, alignItems: "flex-start" }}>
                    {!n.read && <span style={{ width: 7, height: 7, borderRadius: RADIUS.pill, background: C.orange, marginTop: 5, flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center justify-between" style={{ gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: n.read ? 600 : 700, color: C.black }}>{n.title}</span>
                        <span style={{ fontSize: 11, color: C.grayText, flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis",
                           display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {n.body}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
