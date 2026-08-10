import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Clock, Bike, Plus, Minus, Store, Heart } from "lucide-react";
import { C, FONT, WARM, formatBRL } from "../theme";
import { ICONS } from "../data/icons";
import { useRestaurant } from "../hooks/useRestaurant";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../hooks/useFavorites";
import Header from "../components/Header";

function FoodPhoto({ v = 0, icon: Icon, radius = 16, style }) {
  return (
    <div style={{ position: "relative", background: WARM[v % WARM.length], borderRadius: radius, overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 25% 12%, rgba(255,255,255,.28), transparent 60%)" }} />
      {Icon && <Icon size={26} color="rgba(255,255,255,.5)" style={{ position: "absolute", right: 10, bottom: 10 }} />}
    </div>
  );
}

export default function Restaurant() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { restaurant, loading, error } = useRestaurant(slug);
  const { cart, addItem, updateQty } = useCart();
  const { user } = useAuth();
  const { isFavorite, toggle: toggleFavorite } = useFavorites(user?.id);

  if (loading) {
    return (
      <div style={{ fontFamily: FONT, minHeight: "60vh", display: "grid", placeItems: "center", padding: 24 }}>
        <p style={{ color: C.grayText }}>Carregando restaurante…</p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div style={{ fontFamily: FONT, minHeight: "60vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600 }}>Restaurante não encontrado</p>
          <Link to="/" style={{ color: C.orange, fontWeight: 600, textDecoration: "none" }}>Voltar para a home</Link>
        </div>
      </div>
    );
  }

  const qtyOf = (itemId) => cart.items.find((i) => i.id === itemId)?.qty || 0;
  const menu = restaurant.menu_items || [];

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: 800 }}>
      <Header />

      <section className="vp-wrap" style={{ padding: "20px 24px 0" }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1"
          style={{ background: "none", border: "none", cursor: "pointer", color: C.grayText, fontSize: 14, fontWeight: 500, padding: 0 }}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </section>

      <section className="vp-wrap" style={{ padding: "16px 24px 24px" }}>
        <div className="flex items-center gap-4" style={{ flexWrap: "wrap" }}>
          <FoodPhoto v={restaurant.color_variant} icon={ICONS[restaurant.icon_key] || Store} style={{ width: 96, height: 96, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="flex items-center gap-2" style={{ justifyContent: "space-between" }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.4 }}>{restaurant.name}</h1>
              {user && (
                <button onClick={() => toggleFavorite(restaurant.id)} className="flex items-center gap-1"
                  style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 10, cursor: "pointer",
                           padding: "8px 12px", flexShrink: 0 }}>
                  <Heart size={16} color={isFavorite(restaurant.id) ? C.orange : C.grayText} fill={isFavorite(restaurant.id) ? C.orange : "none"} />
                </button>
              )}
            </div>
            <div style={{ fontSize: 14, color: C.grayText, marginTop: 4 }}>{restaurant.category}</div>
            <div className="flex items-center gap-3" style={{ marginTop: 10 }}>
              <span className="flex items-center gap-1" style={{ fontSize: 13.5, fontWeight: 600 }}>
                <Star size={15} fill={C.orange} color={C.orange} /> {Number(restaurant.rating).toLocaleString("pt-BR")}
              </span>
              <span className="flex items-center gap-1" style={{ fontSize: 13.5, color: C.grayText }}>
                <Clock size={15} /> {restaurant.delivery_time} min
              </span>
              <span className="flex items-center gap-1" style={{ fontSize: 13.5, fontWeight: restaurant.delivery_fee === 0 ? 600 : 500, color: restaurant.delivery_fee === 0 ? C.ok : C.grayText }}>
                <Bike size={15} /> {restaurant.delivery_fee === 0 ? "Grátis" : formatBRL(restaurant.delivery_fee)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="vp-wrap" style={{ padding: "0 24px 120px" }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 14px" }}>Cardápio</h2>
        {menu.length === 0 ? (
          <p style={{ color: C.grayText, fontSize: 14.5 }}>Esse restaurante ainda não cadastrou itens no cardápio.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {menu.map((item) => {
              const qty = qtyOf(item.id);
              return (
                <div key={item.id} className="flex items-center" style={{ gap: 14, padding: 14, background: "#fff",
                     border: `1px solid ${C.line}`, borderRadius: 16 }}>
                  <FoodPhoto v={item.color_variant} radius={12} style={{ width: 72, height: 72, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: C.grayText, marginTop: 2 }}>{item.description}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 6 }}>{formatBRL(item.price)}</div>
                  </div>
                  {qty === 0 ? (
                    <button onClick={() => addItem(restaurant.slug, { id: item.id, name: item.name, price: item.price })}
                      style={{ background: C.orange, color: "#fff", border: "none", cursor: "pointer", borderRadius: 10,
                               padding: "9px 16px", fontFamily: FONT, fontSize: 13.5, fontWeight: 600, flexShrink: 0 }}>
                      Adicionar
                    </button>
                  ) : (
                    <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                      <button onClick={() => updateQty(item.id, qty - 1)}
                        style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff",
                                 cursor: "pointer", display: "grid", placeItems: "center" }}>
                        <Minus size={14} />
                      </button>
                      <span key={qty} className="vp-pop" style={{ fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: "center", display: "inline-block" }}>{qty}</span>
                      <button onClick={() => addItem(restaurant.slug, { id: item.id, name: item.name, price: item.price })}
                        style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: C.orange, color: "#fff",
                                 cursor: "pointer", display: "grid", placeItems: "center" }}>
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
