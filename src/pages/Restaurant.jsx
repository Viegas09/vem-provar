import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Clock, Bike, Plus, Minus } from "lucide-react";
import { C, FONT, formatBRL } from "../theme";
import { getRestaurantBySlug } from "../data/restaurants";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";

function FoodPhoto({ v = 0, icon: Icon, radius = 16, style }) {
  const WARM = [
    "linear-gradient(140deg,#F2A24E,#D65E12)",
    "linear-gradient(140deg,#E8B04B,#C77A1E)",
    "linear-gradient(140deg,#DE8A5A,#A85431)",
    "linear-gradient(140deg,#EFC38A,#D98E3D)",
    "linear-gradient(140deg,#E27A52,#B84A28)",
  ];
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
  const restaurant = getRestaurantBySlug(slug);
  const { cart, addItem, updateQty } = useCart();

  if (!restaurant) {
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
          <FoodPhoto v={restaurant.v} icon={restaurant.icon} style={{ width: 96, height: 96, flexShrink: 0 }} />
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.4 }}>{restaurant.name}</h1>
            <div style={{ fontSize: 14, color: C.grayText, marginTop: 4 }}>{restaurant.cat}</div>
            <div className="flex items-center gap-3" style={{ marginTop: 10 }}>
              <span className="flex items-center gap-1" style={{ fontSize: 13.5, fontWeight: 600 }}>
                <Star size={15} fill={C.orange} color={C.orange} /> {restaurant.rating.toLocaleString("pt-BR")}
              </span>
              <span className="flex items-center gap-1" style={{ fontSize: 13.5, color: C.grayText }}>
                <Clock size={15} /> {restaurant.time} min
              </span>
              <span className="flex items-center gap-1" style={{ fontSize: 13.5, fontWeight: restaurant.free ? 600 : 500, color: restaurant.free ? C.ok : C.grayText }}>
                <Bike size={15} /> {restaurant.fee}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="vp-wrap" style={{ padding: "0 24px 120px" }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 14px" }}>Cardápio</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {restaurant.menu.map((item) => {
            const qty = qtyOf(item.id);
            return (
              <div key={item.id} className="flex items-center" style={{ gap: 14, padding: 14, background: "#fff",
                   border: `1px solid ${C.line}`, borderRadius: 16 }}>
                <FoodPhoto v={item.v} radius={12} style={{ width: 72, height: 72, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 13, color: C.grayText, marginTop: 2 }}>{item.desc}</div>
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
                    <span style={{ fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: "center" }}>{qty}</span>
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
      </section>
    </div>
  );
}
