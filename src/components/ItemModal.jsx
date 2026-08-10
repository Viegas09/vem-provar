import { useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { C, FONT, WARM, formatBRL } from "../theme";

export default function ItemModal({ item, icon: Icon, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  function handleAdd() {
    onAdd({ id: item.id, name: item.name, price: item.price, notes: notes.trim() }, qty);
    onClose();
  }

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(20,20,20,.5)",
               display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} className="vp-fade-in"
        style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480,
                 maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ position: "relative", height: 150, background: WARM[(item.color_variant ?? 0) % WARM.length] }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 25% 12%, rgba(255,255,255,.28), transparent 60%)" }} />
          {Icon && <Icon size={40} color="rgba(255,255,255,.5)" style={{ position: "absolute", right: 16, bottom: 16 }} />}
          <button onClick={onClose}
            style={{ position: "absolute", top: 12, right: 12, width: 34, height: 34, borderRadius: 999,
                     background: "rgba(255,255,255,.94)", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}>
            <X size={17} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 19, fontWeight: 700 }}>{item.name}</div>
          {item.description && (
            <p style={{ fontSize: 14, color: C.grayText, marginTop: 6, lineHeight: 1.5 }}>{item.description}</p>
          )}
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 10 }}>{formatBRL(item.price)}</div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>Alguma observação?</div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200}
              placeholder="Ex: sem cebola, ponto da carne, sem gelo…"
              style={{ width: "100%", minHeight: 70, border: `1.5px solid ${C.line}`, borderRadius: 12, padding: 12,
                       fontFamily: FONT, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
        </div>

        <div className="flex items-center gap-3" style={{ padding: "14px 20px 24px", borderTop: `1px solid ${C.line}`,
             position: "sticky", bottom: 0, background: "#fff" }}>
          <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}
              style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff",
                       cursor: "pointer", display: "grid", placeItems: "center" }}>
              <Minus size={15} />
            </button>
            <span key={qty} className="vp-pop" style={{ fontSize: 16, fontWeight: 700, minWidth: 22, textAlign: "center", display: "inline-block" }}>
              {qty}
            </span>
            <button onClick={() => setQty((q) => q + 1)}
              style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: C.orange, color: "#fff",
                       cursor: "pointer", display: "grid", placeItems: "center" }}>
              <Plus size={15} />
            </button>
          </div>
          <button onClick={handleAdd}
            style={{ flex: 1, background: C.orange, color: "#fff", border: "none", cursor: "pointer",
                     borderRadius: 12, padding: "13px 0", fontFamily: FONT, fontSize: 15, fontWeight: 600 }}>
            Adicionar · {formatBRL(item.price * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}
