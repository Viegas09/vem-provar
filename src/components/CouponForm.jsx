import { useState } from "react";
import { C, FONT, RADIUS } from "../theme";
import { createCoupon } from "../data/queries";

// restaurantId nulo cria um cupom de plataforma (vale em qualquer restaurante) —
// usado tanto pelo painel do restaurante (com o próprio id) quanto pelo admin (null)
export default function CouponForm({ restaurantId = null, onSaved, onCancel }) {
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createCoupon({
        code: code.trim().toUpperCase(),
        restaurant_id: restaurantId,
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order_value: minOrderValue ? Number(minOrderValue) : 0,
        max_uses: maxUses ? Number(maxUses) : null,
        expires_at: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
        active: true,
      });
      onSaved();
    } catch (err) {
      if (err.code === "23505" || /duplicate|unique/i.test(err.message || "")) {
        setError("Esse código já existe. Escolha outro.");
      } else {
        setError(err.message || "Não foi possível criar o cupom. Tente novamente.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, background: C.surface,
         borderRadius: RADIUS.lg, padding: 16, marginBottom: 14, maxWidth: 480 }}>
      <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Código (ex: BEMVINDO10)"
        style={{ border: `1.5px solid ${C.line}`, outline: "none", borderRadius: RADIUS.sm, padding: "10px 12px",
                 fontFamily: FONT, fontSize: 14.5, background: "#fff" }} />
      <div className="flex" style={{ gap: 10 }}>
        <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}
          style={{ flex: 1, border: `1.5px solid ${C.line}`, outline: "none", borderRadius: RADIUS.sm, padding: "10px 12px",
                   fontFamily: FONT, fontSize: 14.5, background: "#fff" }}>
          <option value="percent">% de desconto</option>
          <option value="fixed">R$ fixo</option>
        </select>
        <input required type="number" min="0" step="0.01" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)}
          placeholder={discountType === "percent" ? "Ex: 10" : "Ex: 5,00"}
          style={{ flex: 1, border: `1.5px solid ${C.line}`, outline: "none", borderRadius: RADIUS.sm, padding: "10px 12px",
                   fontFamily: FONT, fontSize: 14.5, background: "#fff" }} />
      </div>
      <div className="flex" style={{ gap: 10 }}>
        <input type="number" min="0" step="0.01" value={minOrderValue} onChange={(e) => setMinOrderValue(e.target.value)}
          placeholder="Pedido mínimo (R$, opcional)"
          style={{ flex: 1, border: `1.5px solid ${C.line}`, outline: "none", borderRadius: RADIUS.sm, padding: "10px 12px",
                   fontFamily: FONT, fontSize: 14.5, background: "#fff" }} />
        <input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)}
          placeholder="Limite de usos (opcional)"
          style={{ flex: 1, border: `1.5px solid ${C.line}`, outline: "none", borderRadius: RADIUS.sm, padding: "10px 12px",
                   fontFamily: FONT, fontSize: 14.5, background: "#fff" }} />
      </div>
      <div>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: C.grayText, display: "block", marginBottom: 4 }}>
          Expira em (opcional)
        </label>
        <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
          style={{ border: `1.5px solid ${C.line}`, outline: "none", borderRadius: RADIUS.sm, padding: "10px 12px",
                   fontFamily: FONT, fontSize: 14.5, background: "#fff" }} />
      </div>
      {error && (
        <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: RADIUS.sm, padding: "10px 12px", fontSize: 13 }}>{error}</div>
      )}
      <div className="flex" style={{ gap: 10 }}>
        <button type="submit" disabled={saving}
          style={{ background: C.orange, color: "#fff", border: "none", cursor: "pointer", borderRadius: RADIUS.sm,
                   padding: "10px 18px", fontFamily: FONT, fontSize: 14, fontWeight: 600 }}>
          {saving ? "Salvando…" : "Criar cupom"}
        </button>
        <button type="button" onClick={onCancel}
          style={{ background: "none", border: `1px solid ${C.line}`, cursor: "pointer", borderRadius: RADIUS.sm,
                   padding: "10px 18px", fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.grayText }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
