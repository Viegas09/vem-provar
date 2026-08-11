import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Clock, Bike, Store, Heart } from "lucide-react";
import { C, FONT, WARM, formatBRL } from "../theme";
import { ICONS } from "../data/icons";
import { useRestaurant } from "../hooks/useRestaurant";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../hooks/useFavorites";
import Header from "../components/Header";
import ItemModal from "../components/ItemModal";
import { Skeleton, SkeletonMenuItem } from "../components/Skeleton";

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
  const { cart, addItem } = useCart();
  const { user } = useAuth();
  const { isFavorite, toggle: toggleFavorite } = useFavorites(user?.id);
  const [selectedItem, setSelectedItem] = useState(null);

  if (loading) {
    return (
      <div style={{ fontFamily: FONT, background: C.white, minHeight: "100vh" }}>
        <Header />
        <section className="vp-wrap" style={{ padding: "16px 24px 24px" }}>
          <div className="flex items-center gap-4" style={{ flexWrap: "wrap" }}>
            <Skeleton width={96} height={96} radius={16} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 10 }}>
              <Skeleton width="45%" height={22} />
              <Skeleton width="30%" height={13} />
              <Skeleton width="55%" height={13} />
            </div>
          </div>
        </section>
        <section className="vp-wrap" style={{ padding: "0 24px 120px" }}>
          <Skeleton width={100} height={17} style={{ marginBottom: 16 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonMenuItem key={i} />)}
          </div>
        </section>
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

  const qtyOf = (itemId) => cart.items.filter((i) => i.id === itemId).reduce((sum, i) => sum + i.qty, 0);
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
                <button key={item.id} onClick={() => setSelectedItem(item)} className="vp-tap"
                  style={{ display: "flex", flexDirection: "column", gap: 10, padding: 14, background: "#fff",
                           border: `1px solid ${C.line}`, borderRadius: 16, textAlign: "left", cursor: "pointer", width: "100%" }}>
                  <div className="flex items-start" style={{ gap: 14 }}>
                    <FoodPhoto v={item.color_variant} radius={12} style={{ width: 72, height: 72, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 13, color: C.grayText, marginTop: 2 }}>{item.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 14.5, fontWeight: 700 }}>{formatBRL(item.price)}</span>
                      {qty > 0 && (
                        <span key={qty} className="vp-pop" style={{ fontSize: 12, fontWeight: 700, color: C.orange,
                             background: "rgba(238,108,26,.1)", padding: "2px 8px", borderRadius: 999 }}>
                          {qty} no carrinho
                        </span>
                      )}
                    </div>
                    <span style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 10,
                         padding: "9px 16px", fontFamily: FONT, fontSize: 13.5, fontWeight: 600, flexShrink: 0 }}>
                      Adicionar
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedItem && (
        <ItemModal item={selectedItem} icon={ICONS[restaurant.icon_key] || Store}
          onClose={() => setSelectedItem(null)}
          onAdd={(cartItem, qty) => addItem(restaurant.slug, cartItem, qty)} />
      )}
    </div>
  );
}
