import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Heart, Star, Clock, Bike, Store, Package } from "lucide-react";
import { C, FONT, WARM, formatBRL } from "../theme";
import { ICONS } from "../data/icons";
import { useAuth } from "../context/AuthContext";
import { fetchFavorites, removeFavorite, fetchFavoriteItems, removeFavoriteItem } from "../data/queries";
import Header from "../components/Header";
import { SkeletonPage } from "../components/Skeleton";

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.grayText, textTransform: "uppercase", letterSpacing: .3,
         margin: "0 0 12px" }}>
      {children}
    </div>
  );
}

function FoodPhoto({ v = 0, icon: Icon, style }) {
  return (
    <div className="vp-photo" style={{ position: "relative", background: WARM[v % WARM.length], borderRadius: 16, overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 25% 12%, rgba(255,255,255,.28), transparent 60%)" }} />
      {Icon && <Icon size={30} color="rgba(255,255,255,.5)" style={{ position: "absolute", right: 12, bottom: 12 }} />}
    </div>
  );
}

function LoadingScreen() {
  return <SkeletonPage />;
}

export default function Favorites() {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    if (!user) return;
    const [restaurants, items] = await Promise.all([fetchFavorites(user.id), fetchFavoriteItems(user.id)]);
    setFavorites(restaurants);
    setFavoriteItems(items);
    setLoading(false);
  }

  useEffect(() => {
    if (user) reload();
  }, [user]);

  if (authLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/entrar" replace />;

  async function handleRemove(restaurantId) {
    await removeFavorite(user.id, restaurantId);
    reload();
  }

  async function handleRemoveItem(menuItemId) {
    await removeFavoriteItem(user.id, menuItemId);
    reload();
  }

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <section className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: 900 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Favoritos</h1>

        {loading ? (
          <LoadingScreen />
        ) : favorites.length === 0 && favoriteItems.length === 0 ? (
          <div className="vp-fade-in" style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(238,108,26,.08)",
                 display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <Heart size={30} color={C.orange} />
            </div>
            <p style={{ fontSize: 15.5, fontWeight: 700, margin: "0 0 4px" }}>Nenhum favorito ainda</p>
            <p style={{ fontSize: 13.5, color: C.grayText, margin: "0 0 18px" }}>
              Toque no coração de um restaurante ou prato pra guardar aqui.
            </p>
            <Link to="/" style={{ display: "inline-flex", background: C.orange, color: "#fff", fontWeight: 600,
                 textDecoration: "none", padding: "11px 22px", borderRadius: 10, fontSize: 14 }}>
              Ver restaurantes
            </Link>
          </div>
        ) : (
          <>
            {favorites.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <SectionTitle>Restaurantes</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {favorites.map((f) => {
                    const r = f.restaurants;
                    if (!r) return null;
                    return (
                      <div key={f.id} style={{ position: "relative", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden" }}>
                        <button onClick={() => handleRemove(r.id)} aria-label={`Remover ${r.name} dos favoritos`}
                          style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: 999,
                                   background: "rgba(255,255,255,.94)", border: `1px solid ${C.line}`, cursor: "pointer",
                                   display: "grid", placeItems: "center", zIndex: 1 }}>
                          <Heart size={15} color={C.orange} fill={C.orange} />
                        </button>
                        <Link to={`/restaurante/${r.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                          <FoodPhoto v={r.color_variant} icon={ICONS[r.icon_key] || Store} style={{ height: 120 }} />
                          <div style={{ padding: 14 }}>
                            <div style={{ fontSize: 15.5, fontWeight: 600 }}>{r.name}</div>
                            <div style={{ fontSize: 13, color: C.grayText, marginTop: 2 }}>{r.category}</div>
                            <div className="flex items-center gap-3" style={{ marginTop: 10 }}>
                              <span className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 600 }}>
                                <Star size={13} fill={C.orange} color={C.orange} /> {Number(r.rating).toLocaleString("pt-BR")}
                              </span>
                              <span className="flex items-center gap-1" style={{ fontSize: 13, color: C.grayText }}>
                                <Clock size={13} /> {r.delivery_time} min
                              </span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {favoriteItems.length > 0 && (
              <div>
                <SectionTitle>Pratos</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {favoriteItems.map((f) => {
                    const item = f.menu_items;
                    const r = item?.restaurants;
                    if (!item) return null;
                    return (
                      <Link key={f.id} to={r ? `/restaurante/${r.slug}` : "#"} className="flex items-center gap-3"
                        style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 12,
                                 textDecoration: "none", color: "inherit" }}>
                        <FoodPhoto v={item.color_variant} icon={Package} style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 12 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14.5, fontWeight: 600 }}>{item.name}</div>
                          {r && <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 1 }}>{r.name}</div>}
                          <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 4 }}>{formatBRL(item.price)}</div>
                        </div>
                        <button type="button" onClick={(e) => { e.preventDefault(); handleRemoveItem(item.id); }}
                          aria-label={`Remover ${item.name} dos favoritos`}
                          style={{ width: 32, height: 32, borderRadius: 999, background: "#fff", border: `1px solid ${C.line}`,
                                   cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
                          <Heart size={15} color={C.orange} fill={C.orange} />
                        </button>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
