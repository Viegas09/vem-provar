import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, Store } from "lucide-react";
import { C, FONT, WARM, formatBRL } from "../theme";
import { ICONS } from "../data/icons";
import { useRestaurant } from "../hooks/useRestaurant";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";
import ItemModal from "../components/ItemModal";

function FoodPhoto({ v = 0, icon: Icon, radius = 12, style, photoUrl }) {
  if (photoUrl) {
    return (
      <div className="vp-photo" style={{ borderRadius: radius, overflow: "hidden", ...style }}>
        <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }
  return (
    <div className="vp-photo" style={{ position: "relative", background: WARM[v % WARM.length], borderRadius: radius, overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 25% 12%, rgba(255,255,255,.28), transparent 60%)" }} />
      {Icon && <Icon size={20} color="rgba(255,255,255,.5)" style={{ position: "absolute", right: 8, bottom: 8 }} />}
    </div>
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const { cart, updateQty, addItem, subtotal } = useCart();
  const { restaurant } = useRestaurant(cart.restaurantSlug);
  const [crossSellItem, setCrossSellItem] = useState(null);
  const deliveryFee = restaurant ? Number(restaurant.delivery_fee) : 0;
  const total = subtotal + deliveryFee;
  const Icon = restaurant ? ICONS[restaurant.icon_key] || Store : Store;

  const menuById = {};
  (restaurant?.menu_items || []).forEach((mi) => { menuById[mi.id] = mi; });

  const cartItemIds = new Set(cart.items.map((i) => i.id));
  const crossSell = (restaurant?.menu_items || [])
    .filter((mi) => mi.available !== false && !cartItemIds.has(mi.id))
    .slice(0, 8);

  function handleCrossSellAdd(item) {
    const hasRequiredComplements = (item.complement_groups || []).some((g) => g.min_qty > 0);
    if (hasRequiredComplements) {
      setCrossSellItem(item);
      return;
    }
    addItem(restaurant.slug, { id: item.id, name: item.name, price: item.price, notes: "", complements: [] }, 1);
  }

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />

      <section className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: 640 }}>
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
              <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
                <FoodPhoto v={restaurant.color_variant} icon={Icon} radius={12} style={{ width: 46, height: 46, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 700 }}>{restaurant.name}</div>
                  <Link to={`/restaurante/${restaurant.slug}`} style={{ fontSize: 13, color: C.orange, fontWeight: 600, textDecoration: "none" }}>
                    Adicionar mais itens
                  </Link>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cart.items.map((item) => {
                const menuItem = menuById[item.id];
                return (
                  <div key={item.lineId} className="flex items-center" style={{ gap: 12, padding: 14, background: "#fff",
                       border: `1px solid ${C.line}`, borderRadius: 16 }}>
                    <FoodPhoto v={menuItem?.color_variant} icon={Icon} photoUrl={menuItem?.image_url}
                      style={{ width: 56, height: 56, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 13.5, color: C.grayText, marginTop: 4 }}>{formatBRL(item.price)} cada</div>
                      {item.complements && item.complements.length > 0 && (
                        <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 4 }}>
                          + {item.complements.map((c) => c.name).join(", ")}
                        </div>
                      )}
                      {item.notes && (
                        <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 4, fontStyle: "italic" }}>Obs: {item.notes}</div>
                      )}
                      <div className="flex items-center gap-2" style={{ marginTop: 10 }}>
                        <button onClick={() => updateQty(item.lineId, item.qty - 1)}
                          style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff",
                                   cursor: "pointer", display: "grid", placeItems: "center" }}>
                          {item.qty === 1 ? <Trash2 size={13} color="#B42318" /> : <Minus size={13} />}
                        </button>
                        <span key={item.qty} className="vp-pop" style={{ fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: "center", display: "inline-block" }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.lineId, item.qty + 1)}
                          style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: C.orange, color: "#fff",
                                   cursor: "pointer", display: "grid", placeItems: "center" }}>
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                      {formatBRL(item.price * item.qty)}
                    </div>
                  </div>
                );
              })}
            </div>

            {crossSell.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Peça também</h2>
                <div className="vp-scroll flex" style={{ gap: 12, overflowX: "auto", paddingBottom: 4 }}>
                  {crossSell.map((item) => (
                    <div key={item.id} style={{ flexShrink: 0, width: 118 }}>
                      <div style={{ position: "relative" }}>
                        <FoodPhoto v={item.color_variant} icon={Icon} photoUrl={item.image_url} radius={14} style={{ width: 118, height: 90 }} />
                        <button onClick={() => handleCrossSellAdd(item)}
                          style={{ position: "absolute", right: 6, bottom: -12, width: 28, height: 28, borderRadius: 999,
                                   border: "none", background: C.orange, color: "#fff", cursor: "pointer",
                                   display: "grid", placeItems: "center", boxShadow: "0 2px 6px rgba(0,0,0,.2)" }}>
                          <Plus size={15} />
                        </button>
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8 }}>{formatBRL(item.price)}</div>
                      <div style={{ fontSize: 12, color: C.grayText, marginTop: 2, lineHeight: 1.3, overflow: "hidden",
                           textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {item.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

      {crossSellItem && (
        <ItemModal item={crossSellItem} icon={Icon}
          onClose={() => setCrossSellItem(null)}
          onAdd={(cartItem, qty) => addItem(restaurant.slug, cartItem, qty)} />
      )}
    </div>
  );
}
