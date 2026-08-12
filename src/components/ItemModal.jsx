import { useState } from "react";
import { X, Minus, Plus, Check } from "lucide-react";
import { C, FONT, WARM, formatBRL } from "../theme";

export default function ItemModal({ item, icon: Icon, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState({});

  const groups = item.complement_groups || [];

  function toggleComplement(group, itemId) {
    setSelected((prev) => {
      const current = prev[group.id] || [];
      if (group.max_qty === 1) {
        return { ...prev, [group.id]: current.includes(itemId) ? [] : [itemId] };
      }
      if (current.includes(itemId)) {
        return { ...prev, [group.id]: current.filter((id) => id !== itemId) };
      }
      if (group.max_qty > 0 && current.length >= group.max_qty) return prev;
      return { ...prev, [group.id]: [...current, itemId] };
    });
  }

  const complementsTotal = groups.reduce((sum, g) => {
    const sel = selected[g.id] || [];
    const items = g.complement_items || [];
    return sum + sel.reduce((s, id) => s + Number(items.find((ci) => ci.id === id)?.price || 0), 0);
  }, 0);
  const unitPrice = Number(item.price) + complementsTotal;
  const invalidGroups = groups.filter((g) => (selected[g.id] || []).length < g.min_qty);

  function handleAdd() {
    if (invalidGroups.length > 0) return;
    const complements = [];
    groups.forEach((g) => {
      const sel = selected[g.id] || [];
      (g.complement_items || []).forEach((ci) => {
        if (sel.includes(ci.id)) complements.push({ id: ci.id, name: ci.name, price: Number(ci.price) });
      });
    });
    onAdd({ id: item.id, name: item.name, price: unitPrice, notes: notes.trim(), complements }, qty);
    onClose();
  }

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(20,20,20,.5)",
               display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} className="vp-fade-in"
        style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480,
                 maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ position: "relative", height: 150, background: item.image_url ? "#000" : WARM[(item.color_variant ?? 0) % WARM.length], overflow: "hidden" }}>
          {item.image_url ? (
            <img src={item.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 25% 12%, rgba(255,255,255,.28), transparent 60%)" }} />
              {Icon && <Icon size={40} color="rgba(255,255,255,.5)" style={{ position: "absolute", right: 16, bottom: 16 }} />}
            </>
          )}
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

          {groups.map((group) => {
            const sel = selected[group.id] || [];
            const atMax = group.max_qty > 0 && sel.length >= group.max_qty;
            const invalid = sel.length < group.min_qty;
            return (
              <div key={group.id} style={{ marginTop: 22 }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 14.5, fontWeight: 700 }}>{group.name}</span>
                  {group.min_qty > 0 ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: invalid ? "#B42318" : C.ok,
                         background: invalid ? "#FDECEC" : "rgba(46,158,91,.1)", padding: "2px 8px", borderRadius: 999 }}>
                      Obrigatório
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.grayText, background: C.surface,
                         padding: "2px 8px", borderRadius: 999 }}>
                      Opcional
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: C.grayText, marginTop: 3, marginBottom: 10 }}>
                  {group.max_qty > 1 ? `Escolha até ${group.max_qty} opções` : "Escolha 1 opção"}
                  {group.min_qty > 0 && ` · mínimo ${group.min_qty}`}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(group.complement_items || []).map((ci) => {
                    const isSel = sel.includes(ci.id);
                    const disabled = !isSel && atMax;
                    return (
                      <button key={ci.id} type="button" disabled={disabled} onClick={() => toggleComplement(group, ci.id)}
                        className="flex items-center justify-between"
                        style={{ width: "100%", textAlign: "left", background: isSel ? "rgba(238,108,26,.08)" : "#fff",
                                 border: `1.5px solid ${isSel ? C.orange : C.line}`, borderRadius: 10, padding: "10px 12px",
                                 cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1 }}>
                        <span style={{ fontSize: 13.5, fontWeight: isSel ? 600 : 500 }}>{ci.name}</span>
                        <span className="flex items-center gap-2">
                          {Number(ci.price) > 0 && (
                            <span style={{ fontSize: 12.5, color: C.grayText }}>+ {formatBRL(ci.price)}</span>
                          )}
                          <span style={{ width: 18, height: 18, borderRadius: group.max_qty === 1 ? 999 : 5, flexShrink: 0,
                               border: `1.5px solid ${isSel ? C.orange : C.line}`, background: isSel ? C.orange : "#fff",
                               display: "grid", placeItems: "center" }}>
                            {isSel && <Check size={12} color="#fff" />}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {invalid && (
                  <div style={{ fontSize: 12, color: "#B42318", marginTop: 6 }}>
                    Escolha pelo menos {group.min_qty} opção{group.min_qty === 1 ? "" : "ões"}
                  </div>
                )}
              </div>
            );
          })}

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
          <button onClick={handleAdd} disabled={invalidGroups.length > 0}
            style={{ flex: 1, background: invalidGroups.length > 0 ? C.gray : C.orange, color: "#fff", border: "none",
                     cursor: invalidGroups.length > 0 ? "default" : "pointer",
                     borderRadius: 12, padding: "13px 0", fontFamily: FONT, fontSize: 15, fontWeight: 600 }}>
            Adicionar · {formatBRL(unitPrice * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}
