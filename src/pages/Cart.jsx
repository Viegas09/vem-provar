import { Link, useNavigate } from "react-router-dom";
import { Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { C, FONT, formatBRL } from "../theme";
import { useRestaurant } from "../hooks/useRestaurant";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";

export default function Cart() {
  const navigate = useNavigate();
  const { cart, updateQty, subtotal } = useCart();
  const { restaurant } = useRestaurant(cart.restaurantSlug);
  const deliveryFee = restaurant ? Number(restaurant.delivery_fee) : 0;
  const total = subtotal + deliveryFee;

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />

      <section className="vp-wrap" style={{ padding: "32px 24px 120px", maxWidth: 640 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 20px" }}>Seu carrinho</h1>

        {cart.items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.grayText }}>
            <ShoppingBag size={40} color={C.gray} style={{ margin: "0 auto 14px" }} />
            <p style={{ fontSize: 15.5, margin: 0 }}>Seu carrinho está vazio.</p>
            <Link to="/" style={{ display: "inline-block", marginTop: 16, color: C.orange, fontWeight: 600, textDecoration: "none" }}>
              Ver restaurantes
            </Link>
          </div>
        ) : (
          <>
            {restaurant && (
              <div style={{ fontSize: 14, color: C.grayText, marginBottom: 16 }}>
                Pedido em <strong style={{ color: C.black }}>{restaurant.name}</strong>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cart.items.map((item) => (
                <div key={item.lineId} className="flex items-center" style={{ gap: 14, padding: 14, background: "#fff",
                     border: `1px solid ${C.line}`, borderRadius: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 13.5, color: C.grayText, marginTop: 4 }}>{formatBRL(item.price)} cada</div>
                    {item.notes && (
                      <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 4, fontStyle: "italic" }}>Obs: {item.notes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                    <button onClick={() => updateQty(item.lineId, item.qty - 1)}
                      style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff",
                               cursor: "pointer", display: "grid", placeItems: "center" }}>
                      <Minus size={14} />
                    </button>
                    <span key={item.qty} className="vp-pop" style={{ fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: "center", display: "inline-block" }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.lineId, item.qty + 1)}
                      style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: C.orange, color: "#fff",
                               cursor: "pointer", display: "grid", placeItems: "center" }}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, minWidth: 76, textAlign: "right" }}>
                    {formatBRL(item.price * item.qty)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, borderTop: `1px solid ${C.line}`, paddingTop: 18 }}>
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

            <button onClick={() => navigate("/checkout")} className="flex items-center justify-center gap-2"
              style={{ marginTop: 20, width: "100%", background: C.orange, color: "#fff", border: "none", cursor: "pointer",
                       borderRadius: 12, padding: "15px 0", fontFamily: FONT, fontSize: 15.5, fontWeight: 600 }}>
              Ir para pagamento <ArrowRight size={18} />
            </button>
          </>
        )}
      </section>
    </div>
  );
}
