import { useState } from "react";
import { X, PackageX, ShieldAlert, ThumbsDown, Clock3, MessageSquareWarning } from "lucide-react";
import { C, FONT, RADIUS, SHADOW } from "../theme";
import { createOrderIssue } from "../data/queries";
import { ISSUE_TYPE_LABELS } from "../lib/orderIssue";

const TYPES = [
  { key: "item_faltando", icon: PackageX },
  { key: "pedido_errado", icon: ShieldAlert },
  { key: "qualidade", icon: ThumbsDown },
  { key: "nao_chegou", icon: Clock3 },
  { key: "outro", icon: MessageSquareWarning },
].map((t) => ({ ...t, label: ISSUE_TYPE_LABELS[t.key] }));

export default function ReportIssueModal({ order, customerId, onClose, onReported }) {
  const [type, setType] = useState(null);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!type) return;
    setSaving(true);
    setError(null);
    try {
      const issue = await createOrderIssue({
        order_id: order.id,
        customer_id: customerId,
        restaurant_id: order.restaurant_id,
        type,
        description: description.trim() || null,
      });
      fetch("/api/notify-order-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, type }),
      }).catch(() => {});
      onReported(issue);
    } catch (err) {
      if (err.code === "23505" || /duplicate/i.test(err.message || "")) {
        setError("Você já relatou um problema nesse pedido.");
      } else {
        setError(err.message || "Não foi possível enviar agora. Tente de novo.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(20,20,20,.55)",
         display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: "24px 24px 0 0",
                 padding: "22px 20px calc(22px + env(safe-area-inset-bottom))", boxShadow: SHADOW.lg }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>O que aconteceu?</span>
          <button type="button" onClick={onClose} aria-label="Fechar"
            style={{ width: 30, height: 30, borderRadius: RADIUS.pill, border: `1px solid ${C.line}`,
                     background: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {TYPES.map(({ key, label, icon: Icon }) => {
            const active = type === key;
            return (
              <button key={key} type="button" onClick={() => setType(key)}
                className="flex items-center gap-3"
                style={{ textAlign: "left", background: active ? "rgba(238,108,26,.08)" : "#fff",
                         border: `1.5px solid ${active ? C.orange : C.line}`, borderRadius: RADIUS.md,
                         padding: "12px 14px", cursor: "pointer" }}>
                <Icon size={18} color={active ? C.orange : C.grayText} />
                <span style={{ fontSize: 14.5, fontWeight: 600, color: active ? C.orange : C.black }}>{label}</span>
              </button>
            );
          })}
        </div>

        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Conte mais detalhes (opcional)" rows={3}
          style={{ width: "100%", border: `1.5px solid ${C.line}`, outline: "none", borderRadius: RADIUS.md,
                   padding: "10px 12px", fontFamily: FONT, fontSize: 14, resize: "vertical", marginBottom: 14,
                   boxSizing: "border-box" }} />

        {error && (
          <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: RADIUS.sm, padding: 10, fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={!type || saving}
          style={{ width: "100%", background: !type || saving ? C.gray : C.orange, color: "#fff", border: "none",
                   cursor: !type || saving ? "default" : "pointer", borderRadius: RADIUS.md, padding: "14px 0",
                   fontFamily: FONT, fontSize: 15, fontWeight: 700 }}>
          {saving ? "Enviando…" : "Enviar relato"}
        </button>
        <p style={{ fontSize: 12, color: C.grayText, margin: "10px 0 0", textAlign: "center" }}>
          O restaurante recebe seu relato na hora e pode te responder pelo chat do pedido.
        </p>
      </form>
    </div>
  );
}
