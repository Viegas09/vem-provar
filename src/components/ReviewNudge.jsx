import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { C, FONT } from "../theme";
import { fetchOrdersForCustomer, fetchReviewsForCustomer } from "../data/queries";
import ReviewModal from "./ReviewModal";

export default function ReviewNudge({ userId }) {
  const [pendingOrder, setPendingOrder] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    Promise.all([fetchOrdersForCustomer(userId), fetchReviewsForCustomer(userId)]).then(([orders, reviews]) => {
      if (cancelled) return;
      const reviewedIds = new Set(reviews.map((r) => r.order_id));
      const candidate = orders.find((o) => o.status === "delivered" && !reviewedIds.has(o.id));
      if (!candidate) return;
      if (sessionStorage.getItem(`vp_review_nudge_dismissed_${candidate.id}`)) return;
      setPendingOrder(candidate);
    });
    return () => { cancelled = true; };
  }, [userId]);

  if (!pendingOrder || dismissed) return null;

  function handleDismiss() {
    sessionStorage.setItem(`vp_review_nudge_dismissed_${pendingOrder.id}`, "1");
    setDismissed(true);
  }

  return (
    <>
      <div className="flex items-center gap-3" style={{ background: "rgba(238,108,26,.08)",
           border: "1.5px solid rgba(238,108,26,.25)", borderRadius: 14, padding: "12px 14px" }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: C.orange, display: "grid",
             placeItems: "center", flexShrink: 0 }}>
          <Star size={17} color="#fff" fill="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            Como foi seu pedido na {pendingOrder.restaurants?.name || "sua última loja"}?
          </div>
          <button type="button" onClick={() => setShowModal(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.orange,
                     fontFamily: FONT, fontSize: 13, fontWeight: 700, padding: 0, marginTop: 4 }}>
            Avaliar agora
          </button>
        </div>
        <button type="button" onClick={handleDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.grayText,
                   display: "grid", placeItems: "center", flexShrink: 0 }}>
          <X size={16} />
        </button>
      </div>

      {showModal && (
        <ReviewModal order={pendingOrder} onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); setDismissed(true); }} />
      )}
    </>
  );
}
