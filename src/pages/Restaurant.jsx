import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Clock, Bike, Store, Heart, XCircle, Search, X } from "lucide-react";
import { C, FONT, WARM, formatBRL } from "../theme";
import { ICONS } from "../data/icons";
import { useRestaurant } from "../hooks/useRestaurant";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../hooks/useFavorites";
import { useUserLocation } from "../hooks/useUserLocation";
import { distanceKm } from "../lib/geolocation";
import Header from "../components/Header";
import ItemModal from "../components/ItemModal";
import { Skeleton, SkeletonMenuItem } from "../components/Skeleton";

function FoodPhoto({ v = 0, icon: Icon, radius = 16, style, photoUrl, iconSize = 26 }) {
  if (photoUrl) {
    return (
      <div style={{ borderRadius: radius, overflow: "hidden", ...style }}>
        <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }
  return (
    <div style={{ position: "relative", background: WARM[v % WARM.length], borderRadius: radius, overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 25% 12%, rgba(255,255,255,.28), transparent 60%)" }} />
      {Icon && <Icon size={iconSize} color="rgba(255,255,255,.5)" style={{ position: "absolute", right: 10, bottom: 10 }} />}
    </div>
  );
}

function RoundIconButton({ onClick, children, style }) {
  return (
    <button onClick={onClick}
      style={{ width: 38, height: 38, borderRadius: 999, border: "none", cursor: "pointer",
               background: "rgba(255,255,255,.94)", display: "grid", placeItems: "center",
               boxShadow: "0 2px 8px rgba(0,0,0,.15)", flexShrink: 0, ...style }}>
      {children}
    </button>
  );
}

export default function Restaurant() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { restaurant, loading, error } = useRestaurant(slug);
  const { cart, addItem, subtotal } = useCart();
  const { user } = useAuth();
  const { isFavorite, toggle: toggleFavorite } = useFavorites(user?.id);
  const [location] = useUserLocation();
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuSearch, setMenuSearch] = useState("");

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
  const menu = (restaurant.menu_items || []).filter((item) => item.available !== false);
  const isClosed = restaurant.is_open === false;
  const Icon = ICONS[restaurant.icon_key] || Store;

  const km =
    location.latitude != null && restaurant.latitude != null
      ? distanceKm(location.latitude, location.longitude, restaurant.latitude, restaurant.longitude)
      : null;

  const showMiniCart = cart.restaurantSlug === restaurant.slug && cart.items.length > 0;

  const query = menuSearch.trim().toLowerCase();
  const isSearching = query.length > 0;
  const highlights = menu.slice(0, 6);
  const filteredMenu = isSearching
    ? menu.filter(
        (item) =>
          item.name.toLowerCase().includes(query) || (item.description || "").toLowerCase().includes(query)
      )
    : menu;

  function renderMenuItem(item) {
    const qty = qtyOf(item.id);
    return (
      <button key={item.id} onClick={() => !isClosed && setSelectedItem(item)} disabled={isClosed} className="vp-tap"
        style={{ display: "flex", gap: 14, padding: "14px 0", background: "none",
                 border: "none", borderBottom: `1px solid ${C.line}`, textAlign: "left", width: "100%",
                 cursor: isClosed ? "default" : "pointer", opacity: isClosed ? 0.55 : 1 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600 }}>{item.name}</div>
          {item.description && (
            <div style={{ fontSize: 13, color: C.grayText, marginTop: 3, lineHeight: 1.4, overflow: "hidden",
                 textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {item.description}
            </div>
          )}
          <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
            <span style={{ fontSize: 14.5, fontWeight: 700 }}>{formatBRL(item.price)}</span>
            {qty > 0 && (
              <span key={qty} className="vp-pop" style={{ fontSize: 12, fontWeight: 700, color: C.orange,
                   background: "rgba(238,108,26,.1)", padding: "2px 8px", borderRadius: 999 }}>
                {qty} no carrinho
              </span>
            )}
          </div>
        </div>
        <FoodPhoto v={item.color_variant} radius={12} style={{ width: 88, height: 88, flexShrink: 0 }} photoUrl={item.image_url} />
      </button>
    );
  }

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: 800 }}>
      <Header />

      <div style={{ position: "relative", height: 168, overflow: "hidden" }}>
        <FoodPhoto v={restaurant.color_variant} icon={Icon} iconSize={64} radius={0}
          style={{ width: "100%", height: "100%" }} photoUrl={restaurant.banner_url} />
        <div className="flex items-center justify-between vp-wrap"
          style={{ position: "absolute", top: 14, left: 0, right: 0, padding: "0 16px" }}>
          <RoundIconButton onClick={() => navigate(-1)}><ArrowLeft size={18} /></RoundIconButton>
          {user && (
            <RoundIconButton onClick={() => toggleFavorite(restaurant.id)}>
              <Heart size={17} color={isFavorite(restaurant.id) ? C.orange : C.black} fill={isFavorite(restaurant.id) ? C.orange : "none"} />
            </RoundIconButton>
          )}
        </div>
      </div>

      <section className="vp-wrap" style={{ padding: "0 16px", maxWidth: 640 }}>
        <div style={{ position: "relative", marginTop: -40, background: "#fff", borderRadius: 18, padding: "18px 18px 14px",
             boxShadow: "0 4px 20px rgba(20,20,20,.08)", border: `1px solid ${C.line}` }}>
          <div className="flex items-start gap-3">
            <FoodPhoto v={restaurant.color_variant} icon={Icon} radius={14} style={{ width: 58, height: 58, flexShrink: 0,
                 marginTop: -36, border: "3px solid #fff" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: -0.3 }}>{restaurant.name}</h1>
              <div style={{ fontSize: 13, color: C.grayText, marginTop: 2 }}>
                {restaurant.category}{km != null && ` · ${km.toFixed(1)} km`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3" style={{ marginTop: 12, flexWrap: "wrap" }}>
            <span className="flex items-center gap-1" style={{ fontSize: 13.5, fontWeight: 600 }}>
              <Star size={15} fill={C.orange} color={C.orange} /> {Number(restaurant.rating).toLocaleString("pt-BR")}
            </span>
            <span style={{ width: 1, height: 14, background: C.line }} />
            <span className="flex items-center gap-1" style={{ fontSize: 13.5, color: C.grayText }}>
              <Clock size={15} /> {restaurant.delivery_time} min
            </span>
            <span style={{ width: 1, height: 14, background: C.line }} />
            <span className="flex items-center gap-1" style={{ fontSize: 13.5, fontWeight: restaurant.delivery_fee === 0 ? 600 : 500, color: restaurant.delivery_fee === 0 ? C.ok : C.grayText }}>
              <Bike size={15} /> {restaurant.delivery_fee === 0 ? "Grátis" : formatBRL(restaurant.delivery_fee)}
            </span>
          </div>
        </div>
      </section>

      <section className="vp-wrap" style={{ padding: "18px 16px 0", maxWidth: 640 }}>
        {isClosed && (
          <div className="flex items-center gap-2" style={{ background: "#FDECEC", color: "#B42318", borderRadius: 12,
               padding: "12px 16px", fontSize: 13.5, fontWeight: 600, marginBottom: 18 }}>
            <XCircle size={17} style={{ flexShrink: 0 }} /> Este restaurante está fechado no momento — não é possível fazer pedidos.
          </div>
        )}

        <div className="flex items-center gap-2" style={{ background: C.surface, borderRadius: 10, padding: "0 12px", height: 44, marginBottom: 20 }}>
          <Search size={16} color={C.grayText} />
          <input value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)}
            placeholder={`Buscar em ${restaurant.name}`}
            style={{ border: "none", outline: "none", flex: 1, background: "transparent", fontFamily: FONT, fontSize: 14 }} />
          {menuSearch && (
            <button onClick={() => setMenuSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.grayText, display: "grid", placeItems: "center" }}>
              <X size={16} />
            </button>
          )}
        </div>

        {!isSearching && highlights.length > 0 && (
          <div style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px" }}>Destaques</h2>
            <div className="vp-scroll flex" style={{ gap: 12, overflowX: "auto", paddingBottom: 4 }}>
              {highlights.map((item) => {
                const qty = qtyOf(item.id);
                return (
                  <button key={item.id} onClick={() => !isClosed && setSelectedItem(item)} disabled={isClosed} className="vp-tap"
                    style={{ display: "flex", flexDirection: "column", gap: 8, background: "none", border: "none",
                             cursor: isClosed ? "default" : "pointer", flexShrink: 0, width: 132, textAlign: "left",
                             opacity: isClosed ? 0.55 : 1 }}>
                    <div style={{ position: "relative" }}>
                      <FoodPhoto v={item.color_variant} radius={14} style={{ width: 132, height: 100 }} photoUrl={item.image_url} />
                      {qty > 0 && (
                        <span key={qty} className="vp-pop" style={{ position: "absolute", top: 6, right: 6, background: C.orange, color: "#fff",
                             fontSize: 11, fontWeight: 700, borderRadius: 999, minWidth: 18, height: 18,
                             display: "grid", placeItems: "center", padding: "0 4px" }}>
                          {qty}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{formatBRL(item.price)}</div>
                    <div style={{ fontSize: 12.5, color: C.grayText, lineHeight: 1.3, overflow: "hidden",
                         textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {item.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ paddingBottom: showMiniCart ? 190 : 120 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 4px" }}>
            {isSearching ? `Resultados para "${menuSearch.trim()}"` : "Cardápio"}
          </h2>
          {menu.length === 0 ? (
            <p style={{ color: C.grayText, fontSize: 14.5, marginTop: 12 }}>Esse restaurante ainda não cadastrou itens no cardápio.</p>
          ) : filteredMenu.length === 0 ? (
            <p style={{ color: C.grayText, fontSize: 14.5, marginTop: 12 }}>Nenhum item encontrado.</p>
          ) : (
            <div>{filteredMenu.map(renderMenuItem)}</div>
          )}
        </div>
      </section>

      {showMiniCart && (
        <Link to="/carrinho" className="vp-minicart flex items-center justify-between vp-tap"
          style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 608,
                   zIndex: 41, background: C.black, color: "#fff",
                   borderRadius: 14, padding: "14px 18px", textDecoration: "none", boxShadow: "0 8px 24px rgba(0,0,0,.25)" }}>
          <span style={{ fontSize: 14.5, fontWeight: 700 }}>{formatBRL(subtotal)} · Ver carrinho</span>
          <span style={{ background: C.orange, color: "#fff", fontSize: 12.5, fontWeight: 700, borderRadius: 999,
               minWidth: 22, height: 22, display: "grid", placeItems: "center", padding: "0 6px" }}>
            {cart.items.reduce((sum, i) => sum + i.qty, 0)}
          </span>
        </Link>
      )}

      {selectedItem && (
        <ItemModal item={selectedItem} icon={Icon}
          onClose={() => setSelectedItem(null)}
          onAdd={(cartItem, qty) => addItem(restaurant.slug, cartItem, qty)} />
      )}
    </div>
  );
}
