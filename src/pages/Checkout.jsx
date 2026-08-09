import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CreditCard, QrCode, Banknote } from "lucide-react";
import { C, FONT, formatBRL } from "../theme";
import { useRestaurant } from "../hooks/useRestaurant";
import { useCart } from "../context/CartContext";
import { useUserLocation } from "../hooks/useUserLocation";
import { createOrder } from "../data/queries";
import Header from "../components/Header";
import LocateButton from "../components/LocateButton";

const PAYMENT_METHODS = [
  { id: "pix", label: "Pix", icon: QrCode },
  { id: "card", label: "Cartão na entrega", icon: CreditCard },
  { id: "cash", label: "Dinheiro", icon: Banknote },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, subtotal, clearCart } = useCart();
  const { restaurant } = useRestaurant(cart.restaurantSlug);
  const deliveryFee = restaurant ? Number(restaurant.delivery_fee) : 0;
  const total = subtotal + deliveryFee;

  const [location, setLocation] = useUserLocation();
  const [address, setAddress] = useState(location.address || "");
  const [payment, setPayment] = useState("pix");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const submittedRef = useRef(false);

  function handleLocated({ latitude, longitude, address: found }) {
    const nextAddress = found || address;
    setAddress(nextAddress);
    setLocation({ address: nextAddress, latitude, longitude });
  }

  useEffect(() => {
    if (cart.items.length === 0 && !submittedRef.current) navigate("/carrinho");
  }, [cart.items.length, navigate]);

  if (cart.items.length === 0 && !submittedRef.current) return null;

  async function handleConfirm(e) {
    e.preventDefault();
    if (!address.trim() || !restaurant) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await createOrder({
        restaurantId: restaurant.id,
        address,
        paymentMethod: payment,
        subtotal,
        deliveryFee,
        total,
        items: cart.items,
      });
      submittedRef.current = true;
      clearCart();
      navigate("/pedido-confirmado", { state: { orderId: order.id, orderNumber: order.id.slice(0, 8), total, payment } });
    } catch (err) {
      setSubmitError("Não foi possível confirmar o pedido. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />

      <form onSubmit={handleConfirm} className="vp-wrap" style={{ padding: "32px 24px 120px", maxWidth: 640 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 20px" }}>Finalizar pedido</h1>

        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Endereço de entrega</h2>
        <div className="flex items-center gap-2" style={{ background: "#fff", border: `1.5px solid ${C.line}`,
             borderRadius: 12, padding: "0 14px", minHeight: 54, marginBottom: 24 }}>
          <MapPin size={20} color={C.orange} />
          <input value={address} onChange={(e) => setAddress(e.target.value)} required
            placeholder="Rua, número, bairro"
            style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 15, background: "transparent", color: C.black }} />
        </div>
        <div style={{ marginTop: -14, marginBottom: 24 }}>
          <LocateButton onLocated={handleLocated} />
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Forma de pagamento</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {PAYMENT_METHODS.map((m) => {
            const Icon = m.icon;
            const active = payment === m.id;
            return (
              <button key={m.id} type="button" onClick={() => setPayment(m.id)} className="flex items-center gap-3"
                style={{ background: active ? "rgba(238,108,26,.08)" : "#fff",
                         border: `1.5px solid ${active ? C.orange : C.line}`, borderRadius: 12,
                         padding: "14px 16px", cursor: "pointer", textAlign: "left" }}>
                <Icon size={19} color={active ? C.orange : C.grayText} />
                <span style={{ fontSize: 14.5, fontWeight: active ? 600 : 500 }}>{m.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 18, marginBottom: 20 }}>
          <div className="flex items-center justify-between" style={{ fontSize: 14.5, color: C.grayText, marginBottom: 6 }}>
            <span>Subtotal</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between" style={{ fontSize: 14.5, color: C.grayText, marginBottom: 10 }}>
            <span>Taxa de entrega</span>
            <span>{deliveryFee === 0 ? "Grátis" : formatBRL(deliveryFee)}</span>
          </div>
          <div className="flex items-center justify-between" style={{ fontSize: 18, fontWeight: 700 }}>
            <span>Total</span>
            <span>{formatBRL(total)}</span>
          </div>
        </div>

        {submitError && (
          <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 16 }}>
            {submitError}
          </div>
        )}

        <button type="submit" disabled={submitting}
          style={{ width: "100%", background: submitting ? C.gray : C.orange, color: "#fff", border: "none",
                   cursor: submitting ? "default" : "pointer", borderRadius: 12, padding: "15px 0", fontFamily: FONT,
                   fontSize: 15.5, fontWeight: 600 }}>
          {submitting ? "Confirmando…" : "Confirmar pedido"}
        </button>
      </form>
    </div>
  );
}
