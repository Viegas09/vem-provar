import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Heart, Star, Clock, Bike, Store } from "lucide-react";
import { C, FONT, WARM } from "../theme";
import { ICONS } from "../data/icons";
import { useAuth } from "../context/AuthContext";
import { fetchFavorites, removeFavorite } from "../data/queries";
import Header from "../components/Header";
import { SkeletonPage } from "../components/Skeleton";

function FoodPhoto({ v = 0, icon: Icon, style }) {
  return (
    <div style={{ position: "relative", background: WARM[v % WARM.length], borderRadius: 16, overflow: "hidden", ...style }}>
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
  const [loading, setLoading] = useState(true);

  async function reload() {
    if (!user) return;
    const data = await fetchFavorites(user.id);
    setFavorites(data);
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

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <section className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: 900 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Favoritos</h1>

        {loading ? (
          <LoadingScreen />
        ) : favorites.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Heart size={44} color={C.gray} style={{ margin: "0 auto 14px" }} />
            <p style={{ color: C.grayText, fontSize: 14.5, margin: "0 0 14px" }}>Nenhum favorito ainda.</p>
            <Link to="/" style={{ color: C.orange, fontWeight: 600, textDecoration: "none" }}>Voltar para a home</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {favorites.map((f) => {
              const r = f.restaurants;
              if (!r) return null;
              return (
                <div key={f.id} style={{ position: "relative", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden" }}>
                  <button onClick={() => handleRemove(r.id)}
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
        )}
      </section>
    </div>
  );
}
