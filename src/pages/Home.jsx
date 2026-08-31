import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  MapPin, Star, Clock, Bike, Store, ArrowRight,
  Flame, Heart, ChevronRight, AtSign, Smartphone, X,
} from "lucide-react";
import { C, FONT, WARM } from "../theme";
import { CATS, ICONS } from "../data/icons";
import { useRestaurants } from "../hooks/useRestaurants";
import { useRecentOrders } from "../hooks/useRecentOrders";
import { useUserLocation } from "../hooks/useUserLocation";
import { useFavorites } from "../hooks/useFavorites";
import { useAppMode } from "../hooks/useAppMode";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { distanceKm } from "../lib/geolocation";
import Header from "../components/Header";
import AppHeader from "../components/AppHeader";
import ReviewNudge from "../components/ReviewNudge";
import LocateButton from "../components/LocateButton";
import { SkeletonCard } from "../components/Skeleton";
import PullToRefresh from "../components/PullToRefresh";
import WORDMARK_LIGHT from "../assets/wordmark-light.png";

const HOOD_TAGS = ["pediram hoje", "recomendam", "novo perto de você", "em alta"];

const SORT_OPTIONS = [
  { value: "relevancia", label: "Relevância" },
  { value: "nota", label: "Melhor nota" },
  { value: "entrega", label: "Menor tempo" },
  { value: "distancia", label: "Mais perto" },
];

function parseDeliveryMinutes(deliveryTime) {
  const match = String(deliveryTime).match(/\d+/);
  return match ? Number(match[0]) : Infinity;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function FoodPhoto({ v = 0, icon: Icon, radius = 16, style }) {
  return (
    <div className="vp-photo" style={{ position: "relative", background: WARM[v % WARM.length], borderRadius: radius, overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 25% 12%, rgba(255,255,255,.28), transparent 60%)" }} />
      {Icon && <Icon size={30} color="rgba(255,255,255,.5)" style={{ position: "absolute", right: 12, bottom: 12 }} />}
    </div>
  );
}

export default function Home() {
  const isAppMode = useAppMode();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("relevancia");
  const { restaurants, loading, error, refetch } = useRestaurants();
  const [location, setLocation] = useUserLocation();
  const { user } = useAuth();
  const { isFavorite, toggle: toggleFavorite } = useFavorites(user?.id);
  const { orders: recentOrders } = useRecentOrders(user?.id);
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [reorderedId, setReorderedId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const hasQuery = query.length > 0;

  function handleLocated({ latitude, longitude, address }) {
    setLocation({ address: address || location.address, latitude, longitude });
  }

  function handleReorder(order) {
    const slug = order.restaurants?.slug;
    if (!slug) return;
    (order.order_items || []).forEach((item) => {
      if (!item.menu_item_id) return;
      addItem(slug, { id: item.menu_item_id, name: item.name, price: item.price, notes: item.notes || "" }, item.qty);
    });
    setReorderedId(order.id);
    showToast(`Pedido de ${order.restaurants?.name || "novo"} adicionado ao carrinho`);
  }

  const matchingRestaurants = hasQuery
    ? restaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          (r.category || "").toLowerCase().includes(query) ||
          (r.menu_items || []).some((item) => item.name.toLowerCase().includes(query))
      )
    : restaurants;

  const hasLocation = location.latitude != null && location.longitude != null;
  const restaurantsWithDistance = matchingRestaurants.map((r) => ({
    ...r,
    distanceKm:
      hasLocation && r.latitude != null && r.longitude != null
        ? distanceKm(location.latitude, location.longitude, r.latitude, r.longitude)
        : null,
  }));
  const sortedRestaurants = [...restaurantsWithDistance].sort((a, b) => {
    if (sortBy === "nota") return Number(b.rating) - Number(a.rating);
    if (sortBy === "entrega") return parseDeliveryMinutes(a.delivery_time) - parseDeliveryMinutes(b.delivery_time);
    if (sortBy === "distancia" || (sortBy === "relevancia" && hasLocation)) {
      return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
    }
    return 0;
  });

  const firstName = user?.user_metadata?.full_name?.split(" ")[0];

  const highlights = restaurants
    .filter((r) => r.menu_items?.length > 0)
    .slice(0, 4)
    .map((r, i) => ({
      restaurantId: r.id,
      slug: r.slug,
      dish: r.menu_items[0].name,
      rest: r.name,
      v: r.menu_items[0].color_variant,
      icon: ICONS[r.icon_key] || Store,
      tag: HOOD_TAGS[i % HOOD_TAGS.length],
    }));

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: 800 }}>
      {isAppMode ? <AppHeader /> : <Header />}

      <PullToRefresh onRefresh={refetch}>

      {/* ── Hero: pedir comida (só no site) ── */}
      {!isAppMode && (
        <section className="vp-wrap" style={{ padding: "56px 24px 40px" }}>
          <div className="vp-hero vp-fade-in">
            <div>
              {firstName && (
                <p style={{ fontSize: 14.5, color: C.grayText, fontWeight: 500, margin: "0 0 6px" }}>
                  {greeting()}, {firstName}
                </p>
              )}
              <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
                <span style={{ background: "rgba(238,108,26,.1)", color: C.orange, fontSize: 12.5, fontWeight: 600,
                               padding: "5px 12px", borderRadius: 999 }}>Itapecerica da Serra</span>
              </div>
              <h1 style={{ fontSize: 44, lineHeight: 1.08, fontWeight: 700, letterSpacing: -1, margin: 0 }}>
                O maior portal de gastronomia da sua cidade
              </h1>
              <p style={{ fontSize: 17, color: C.grayText, marginTop: 16, maxWidth: 440, lineHeight: 1.5 }}>
                Descubra. Prove. Compartilhe. Peça dos melhores restaurantes, cafés e pizzarias de Itapecerica — e receba em casa.
              </p>

              {/* entrada por endereço (a gramática do delivery) */}
              <div style={{ marginTop: 26, display: "flex", gap: 10, maxWidth: 480, flexWrap: "wrap" }}>
                <div className="flex items-center gap-2" style={{ flex: "1 1 260px", background: "#fff", border: `1.5px solid ${C.line}`,
                         borderRadius: 12, padding: "0 14px", minHeight: 54 }}>
                  <MapPin size={20} color={C.orange} />
                  <input value={location.address} onChange={(e) => setLocation({ ...location, address: e.target.value })}
                    placeholder="Digite seu endereço"
                    style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 15, background: "transparent", color: C.black }} />
                </div>
                <a href="#restaurantes" className="flex items-center justify-center gap-2"
                  style={{ background: C.orange, color: "#fff", border: "none", cursor: "pointer", borderRadius: 12,
                           padding: "0 26px", minHeight: 54, fontFamily: FONT, fontSize: 15.5, fontWeight: 600, textDecoration: "none" }}>
                  Ver restaurantes <ArrowRight size={18} />
                </a>
              </div>
              <div style={{ marginTop: 12 }}>
                <LocateButton onLocated={handleLocated} />
              </div>
              <div className="flex items-center gap-2" style={{ marginTop: 14, color: C.grayText, fontSize: 13 }}>
                <Bike size={15} color={C.ok} /> Entrega rápida na sua região · pague com Pix
              </div>
            </div>

            {/* colagem de fotos (produto: fotos reais dos pratos) */}
            <div className="vp-hero-art">
              <FoodPhoto v={0} icon={CATS[0].icon} style={{ gridRow: "span 2" }} />
              <FoodPhoto v={4} icon={CATS[1].icon} />
              <FoodPhoto v={2} icon={CATS[2].icon} />
            </div>
          </div>
        </section>
      )}

      {/* ── Categorias ── */}
      <section className="vp-wrap" style={{ padding: isAppMode ? "20px 24px 8px" : "12px 24px 8px" }}>
        <div className="vp-scroll" style={{ display: "flex", gap: 26, paddingBottom: 8 }}>
          {CATS.map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.key} className="vp-tap" onClick={() => navigate(`/busca?cat=${c.key}`)}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column",
                         alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{ width: 66, height: 66, borderRadius: 20, background: C.surface, display: "grid", placeItems: "center" }}>
                  <Icon size={27} color={C.black} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: C.grayText }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {!error && !hasQuery && user && (
        <section className="vp-wrap" style={{ padding: "20px 24px 0" }}>
          <ReviewNudge userId={user.id} />
        </section>
      )}

      {!error && !hasQuery && recentOrders.length > 0 && (
        <section className="vp-wrap" style={{ padding: "20px 24px 8px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px", letterSpacing: -.3 }}>Peça de novo</h2>
          <div className="vp-scroll" style={{ display: "flex", gap: 14 }}>
            {recentOrders.map((order) => {
              const r = order.restaurants;
              const items = order.order_items || [];
              const summary = items.map((i) => `${i.qty}x ${i.name}`).join(", ");
              const justReordered = reorderedId === order.id;
              return (
                <div key={order.id} style={{ width: 208, flexShrink: 0, background: "#fff", border: `1px solid ${C.line}`,
                     borderRadius: 16, overflow: "hidden" }}>
                  <Link to={`/restaurante/${r.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <FoodPhoto v={r.color_variant} icon={ICONS[r.icon_key] || Store} radius={0} style={{ height: 88 }} />
                    <div style={{ padding: "10px 12px 0" }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.name}
                      </div>
                      {summary && (
                        <div style={{ fontSize: 12, color: C.grayText, marginTop: 3, lineHeight: 1.4, overflow: "hidden",
                             textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {summary}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div style={{ padding: "10px 12px 12px" }}>
                    <button onClick={() => handleReorder(order)}
                      style={{ width: "100%", background: justReordered ? C.ok : "rgba(238,108,26,.1)",
                               color: justReordered ? "#fff" : C.orange, border: "none", borderRadius: 10,
                               padding: "9px 0", fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      {justReordered ? "Adicionado ao carrinho!" : "Pedir de novo"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {error && (
        <section className="vp-wrap" style={{ padding: "24px" }}>
          <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: 12, padding: 16, fontSize: 14 }}>
            Não foi possível carregar os restaurantes agora. Tente atualizar a página.
          </div>
        </section>
      )}

      {!error && !hasQuery && highlights.length > 0 && (
        <section className="vp-wrap" style={{ padding: "34px 24px 8px" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
            <div className="flex items-center gap-2">
              <Flame size={20} color={C.orange} fill={C.orange} />
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -.4 }}>Tá bombando na vizinhança</h2>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: C.orange, animation: "vp-pulse 1.4s ease-in-out infinite" }} />
            </div>
            <a href="#restaurantes" className="flex items-center" style={{ color: C.orange, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
              Ver tudo <ChevronRight size={17} />
            </a>
          </div>
          <div className="vp-scroll" style={{ display: "flex", gap: 18 }}>
            {highlights.map((h, i) => (
              <Link key={i} to={`/restaurante/${h.slug}`} className="vp-tap" style={{ width: 220, flexShrink: 0,
                   background: "#fff", border: `1px solid ${C.line}`, borderRadius: 18, overflow: "hidden",
                   textDecoration: "none", color: "inherit", display: "block" }}>
                <div style={{ position: "relative" }}>
                  <FoodPhoto v={h.v} icon={h.icon} radius={0} style={{ height: 130 }} />
                  {user && (
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(h.restaurantId); }}
                      aria-label={isFavorite(h.restaurantId) ? `Remover ${h.rest} dos favoritos` : `Favoritar ${h.rest}`}
                      style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: 999,
                               background: "rgba(255,255,255,.94)", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}>
                      <Heart key={String(isFavorite(h.restaurantId))} className="vp-pop" size={17} color={isFavorite(h.restaurantId) ? C.orange : C.grayText} fill={isFavorite(h.restaurantId) ? C.orange : "none"} />
                    </button>
                  )}
                </div>
                <div style={{ padding: "12px 14px 14px" }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{h.dish}</div>
                  <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 1 }}>{h.rest}</div>
                  <span style={{ display: "inline-block", marginTop: 10, fontSize: 11.5, fontWeight: 600, color: C.orange,
                                 background: "rgba(238,108,26,.1)", padding: "4px 9px", borderRadius: 8 }}>{h.tag}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Restaurantes ── */}
      <section id="restaurantes" className="vp-wrap" style={{ padding: "34px 24px 20px" }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 18, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -.4 }}>
            {hasQuery
              ? `Resultados para "${searchParams.get("q")}"`
              : hasLocation
              ? "Restaurantes mais perto de você"
              : "Restaurantes perto de você"}
          </h2>
          {hasQuery && (
            <button onClick={() => setSearchParams({})} className="flex items-center gap-1"
              style={{ background: "none", border: "none", cursor: "pointer", color: C.grayText, fontSize: 13, fontWeight: 600, padding: 0 }}>
              <X size={14} /> Limpar busca
            </button>
          )}
        </div>

        {!loading && !error && sortedRestaurants.length > 0 && (
          <div className="vp-scroll" style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {SORT_OPTIONS.map((opt) => {
              const active = sortBy === opt.value;
              return (
                <button key={opt.value} onClick={() => setSortBy(opt.value)}
                  style={{ flexShrink: 0, background: active ? C.black : "#fff", color: active ? "#fff" : C.grayText,
                           border: `1.5px solid ${active ? C.black : C.line}`, borderRadius: 999, cursor: "pointer",
                           padding: "7px 14px", fontFamily: FONT, fontSize: 13, fontWeight: 600 }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !error && restaurants.length === 0 ? (
          <p style={{ color: C.grayText, fontSize: 14.5 }}>Nenhum restaurante cadastrado ainda.</p>
        ) : !error && sortedRestaurants.length === 0 ? (
          <p style={{ color: C.grayText, fontSize: 14.5 }}>Nenhum resultado para essa busca.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {sortedRestaurants.map((r) => (
              <Link key={r.slug} to={`/restaurante/${r.slug}`} className="vp-tap flex" style={{ gap: 14, padding: 14, background: "#fff",
                   border: `1px solid ${C.line}`, borderRadius: 16, cursor: "pointer", textDecoration: "none", color: "inherit", position: "relative" }}>
                {user && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(r.id); }}
                    aria-label={isFavorite(r.id) ? `Remover ${r.name} dos favoritos` : `Favoritar ${r.name}`}
                    style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: 999,
                             background: "rgba(255,255,255,.94)", border: `1px solid ${C.line}`, cursor: "pointer",
                             display: "grid", placeItems: "center", zIndex: 1 }}>
                    <Heart key={String(isFavorite(r.id))} className="vp-pop" size={15} color={isFavorite(r.id) ? C.orange : C.grayText} fill={isFavorite(r.id) ? C.orange : "none"} />
                  </button>
                )}
                <FoodPhoto v={r.color_variant} icon={ICONS[r.icon_key] || Store} style={{ width: 88, height: 88, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: C.grayText, marginTop: 2 }}>{r.category}</div>
                  <div className="flex items-center gap-3" style={{ marginTop: 12 }}>
                    <span className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 600 }}>
                      <Star size={14} fill={C.orange} color={C.orange} /> {Number(r.rating).toLocaleString("pt-BR")}
                    </span>
                    <span className="flex items-center gap-1" style={{ fontSize: 13, color: C.grayText }}>
                      <Clock size={14} /> {r.delivery_time} min
                    </span>
                    <span className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: r.delivery_fee === 0 ? 600 : 500, color: r.delivery_fee === 0 ? C.ok : C.grayText }}>
                      <Bike size={14} /> {r.delivery_fee === 0 ? "Grátis" : `R$ ${Number(r.delivery_fee).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    </span>
                    {r.distanceKm != null && (
                      <span className="flex items-center gap-1" style={{ fontSize: 13, color: C.grayText }}>
                        <MapPin size={14} /> {r.distanceKm.toFixed(1)} km
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Faixa de papéis + rodapé (só no site) ── */}
      {!isAppMode && (
        <>
          <section style={{ background: C.black, marginTop: 30 }}>
            <div className="vp-wrap" style={{ padding: "48px 24px" }}>
              <div className="vp-roles">
                <div id="restaurante" style={{ background: "rgba(255,255,255,.04)", borderRadius: 20, padding: "30px 28px" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: C.orange, display: "grid", placeItems: "center", marginBottom: 16 }}>
                    <Store size={24} color="#fff" />
                  </div>
                  <h3 style={{ color: C.white, fontSize: 21, fontWeight: 700, margin: 0 }}>Tem um restaurante?</h3>
                  <p style={{ color: C.gray, fontSize: 14.5, marginTop: 8, lineHeight: 1.5 }}>
                    Coloque sua cozinha no maior portal de Itapecerica e comece a receber pedidos hoje mesmo.
                  </p>
                  <Link to="/parceiro/entrar" className="flex items-center gap-2" style={{ marginTop: 18, color: C.orange, textDecoration: "none", fontSize: 14.5, fontWeight: 600 }}>
                    Cadastre seu restaurante <ArrowRight size={17} />
                  </Link>
                </div>
                <div id="entregador" style={{ background: "rgba(255,255,255,.04)", borderRadius: 20, padding: "30px 28px", position: "relative" }}>
                  <span style={{ position: "absolute", top: 24, right: 28, fontSize: 11, fontWeight: 700, color: C.gray,
                       background: "rgba(255,255,255,.08)", padding: "3px 10px", borderRadius: 999 }}>
                    Em breve
                  </span>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: C.orange, display: "grid", placeItems: "center", marginBottom: 16 }}>
                    <Bike size={24} color="#fff" />
                  </div>
                  <h3 style={{ color: C.white, fontSize: 21, fontWeight: 700, margin: 0 }}>Quer entregar com a gente?</h3>
                  <p style={{ color: C.gray, fontSize: 14.5, marginTop: 8, lineHeight: 1.5 }}>
                    Faça suas entregas na cidade, no seu horário, e receba por Pix a cada corrida.
                  </p>
                  <Link to="/entregador/entrar" className="flex items-center gap-2" style={{ marginTop: 18, color: C.orange, textDecoration: "none", fontSize: 14.5, fontWeight: 600 }}>
                    Seja um entregador <ArrowRight size={17} />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <footer style={{ background: C.black, borderTop: `1px solid rgba(255,255,255,.08)` }}>
            <div className="vp-wrap" style={{ padding: "40px 24px 48px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 28 }}>
              <div style={{ maxWidth: 300 }}>
                <div style={{ marginBottom: 12 }}>
                  <img src={WORDMARK_LIGHT} alt="Vem Provar" style={{ height: 38, width: "auto", display: "block" }} draggable={false} />
                </div>
                <p style={{ color: C.gray, fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>
                  O maior portal de gastronomia de Itapecerica da Serra. Descubra. Prove. Compartilhe.
                </p>
                <a href="#" className="flex items-center gap-2" style={{ marginTop: 16, color: C.orange, textDecoration: "none", fontSize: 13.5, fontWeight: 600 }}>
                  <AtSign size={16} /> vemprovaritap
                </a>
              </div>
              <div className="flex" style={{ gap: 56, flexWrap: "wrap" }}>
                {[
                  { h: "Pedir", items: ["Restaurantes", "Categorias", "Cupons"] },
                  { h: "Parceiros", items: ["Cadastre seu restaurante", "Seja entregador"] },
                  { h: "Ajuda", items: ["Central de ajuda", "Fale com a gente"] },
                ].map((col) => (
                  <div key={col.h}>
                    <div style={{ color: C.white, fontSize: 13, fontWeight: 700, marginBottom: 12, letterSpacing: .3 }}>{col.h}</div>
                    {col.items.map((it) => (
                      <a key={it} href="#" style={{ display: "block", color: C.gray, textDecoration: "none", fontSize: 13.5, padding: "5px 0" }}>{it}</a>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="vp-wrap" style={{ padding: "16px 24px", borderTop: `1px solid rgba(255,255,255,.08)`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <span style={{ color: "rgba(184,178,166,.7)", fontSize: 12.5 }}>© 2026 Vem Provar · Itapecerica da Serra</span>
              <span className="flex items-center gap-1" style={{ color: "rgba(184,178,166,.7)", fontSize: 12.5 }}>
                <Smartphone size={13} /> Instale o app pelo navegador
              </span>
            </div>
          </footer>
        </>
      )}
      </PullToRefresh>
    </div>
  );
}
