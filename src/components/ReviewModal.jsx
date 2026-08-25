import { useState } from "react";
import { Star, X } from "lucide-react";
import { C, FONT } from "../theme";
import { useAuth } from "../context/AuthContext";
import { createReview } from "../data/queries";

export default function ReviewModal({ order, onClose, onSaved }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const restaurantName = order.restaurants?.name || "o restaurante";

  async function handleSubmit() {
    if (rating === 0) return;
    setSaving(true);
    setError(null);
    try {
      const firstName = (user.user_metadata?.full_name || "").split(" ")[0] || null;
      const review = await createReview({
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: user.id,
        customerName: firstName,
        rating,
        comment: comment.trim(),
      });
      onSaved(review);
    } catch (err) {
      console.error("ReviewModal: erro ao enviar avaliação", err);
      setError(err.message || "Não foi possível enviar sua avaliação. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(20,20,20,.5)",
               display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} className="vp-fade-in"
        style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480,
                 maxHeight: "92vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between" style={{ padding: "18px 20px 4px" }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Avaliar pedido</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.grayText,
               display: "grid", placeItems: "center" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "12px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: C.grayText, margin: 0 }}>
            Como foi seu pedido em <b style={{ color: C.black }}>{restaurantName}</b>?
          </p>

          <div className="flex items-center justify-center gap-2" style={{ padding: "8px 0" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-label={`Avaliar com ${n} estrela${n > 1 ? "s" : ""}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <Star size={34} fill={n <= (hoverRating || rating) ? C.orange : "none"} color={C.orange} />
              </button>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.grayText, marginBottom: 6 }}>Comentário (opcional)</div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi a comida, a embalagem, o tempo de entrega..."
              rows={4}
              style={{ border: `1.5px solid ${C.line}`, outline: "none", borderRadius: 12, padding: 12,
                       fontFamily: FONT, fontSize: 14, width: "100%", boxSizing: "border-box", resize: "none" }} />
          </div>

          {error && (
            <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: 10, padding: 12, fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="button" onClick={handleSubmit} disabled={rating === 0 || saving}
            style={{ width: "100%", background: rating === 0 || saving ? C.gray : C.orange, color: "#fff", border: "none",
                     cursor: rating === 0 || saving ? "default" : "pointer", borderRadius: 12, padding: "14px 0",
                     fontFamily: FONT, fontSize: 15, fontWeight: 600 }}>
            {saving ? "Enviando…" : "Enviar avaliação"}
          </button>
        </div>
      </div>
    </div>
  );
}
