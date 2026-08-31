import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Package, CheckCircle2, Star } from "lucide-react";
import { C, FONT, WARM, formatBRL } from "../theme";
import { ICONS } from "../data/icons";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { fetchOrdersForCustomer, fetchReviewsForCustomer } from "../data/queries";
import { STATUS_META } from "../lib/orderStatus";
import Header from "../components/Header";
import ReviewModal from "../components/ReviewModal";
import { SkeletonPage } from "../components/Skeleton";
import PullToRefresh from "../components/PullToRefresh";

function LoadingScreen() {
  return <SkeletonPage />;
}

function hashVariant(text) {
  let sum = 0;
  for (let i = 0; i < text.length; i++) sum += text.charCodeAt(i);
  return sum % WARM.length;
}

function dateGroupLabel(dateStr) {
  const d = new Date(dateStr);
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${capitalized}, ${date}`;
}

function RestaurantAvatar({ iconKey, colorVariant, size = 44 }) {
  const Icon = ICONS[iconKey] || Package;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, position: "relative", overflow: "hidden",
         background: WARM[(colorVariant ?? 0) % WARM.length] }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 25% 12%, rgba(255,255,255,.3), transparent 60%)" }} />
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <Icon size={size * 0.42} color="#fff" />
      </div>
    </div>
  );
}

function ItemThumb({ name, size = 30 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", border: "2px solid #fff", flexShrink: 0,
         background: WARM[hashVariant(name)], display: "grid", placeItems: "center" }}>
      <Package size={size * 0.5} color="rgba(255,255,255,.85)" />
    </div>
  );
}

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [reordered, setReordered] = useState(null);
  const [reviewedMap, setReviewedMap] = useState({});
  const [reviewOrder, setReviewOrder] = useState(null);

  function loadOrders() {
    return Promise.all([fetchOrdersForCustomer(user.id), fetchReviewsForCustomer(user.id)]).then(([ordersData, reviewsData]) => {
      setOrders(ordersData);
      const map = {};
      reviewsData.forEach((r) => { map[r.order_id] = r; });
      setReviewedMap(map);
      setLoadingOrders(false);
    });
  }

  useEffect(() => {
    if (!user) return;
    loadOrders();
  }, [user]);

  if (authLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/entrar" replace />;

  function handleReorder(order) {
    const slug = order.restaurants?.slug;
    if (!slug) return;
    (order.order_items || []).forEach((item) => {
      if (!item.menu_item_id) return;
      addItem(slug, { id: item.menu_item_id, name: item.name, price: item.price, notes: item.notes || "" }, item.qty);
    });
    setReordered(order.id);
    showToast(`Pedido de ${order.restaurants?.name || "novo"} adicionado ao carrinho`);
  }

  const groups = [];
  const groupIndex = {};
  orders.forEach((order) => {
    const key = new Date(order.created_at).toDateString();
    if (!(key in groupIndex)) {
      groupIndex[key] = groups.length;
      groups.push({ key, label: dateGroupLabel(order.created_at), orders: [] });
    }
    groups[groupIndex[key]].orders.push(order);
  });

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <PullToRefresh onRefresh={loadOrders}>
      <section className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: 640 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Meus pedidos</h1>

        {loadingOrders ? (
          <LoadingScreen />
        ) : orders.length === 0 ? (
          <div className="vp-fade-in" style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(238,108,26,.08)",
                 display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <Package size={30} color={C.orange} />
            </div>
            <p style={{ fontSize: 15.5, fontWeight: 700, margin: "0 0 4px" }}>Você ainda não fez nenhum pedido</p>
            <p style={{ fontSize: 13.5, color: C.grayText, margin: "0 0 18px" }}>
              Seus pedidos vão aparecer aqui assim que você fizer o primeiro.
            </p>
            <Link to="/" style={{ display: "inline-flex", background: C.orange, color: "#fff", fontWeight: 600,
                 textDecoration: "none", padding: "11px 22px", borderRadius: 10, fontSize: 14 }}>
              Ver restaurantes
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {groups.map((group) => (
              <div key={group.key}>
                <h2 style={{ fontSize: 13.5, fontWeight: 700, color: C.grayText, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: .3 }}>
                  {group.label}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {group.orders.map((order) => {
                    const meta = STATUS_META[order.status] || STATUS_META.pending;
                    const delivered = order.status === "delivered";
                    const items = order.order_items || [];
                    const uniqueItemNames = [...new Set(items.map((i) => i.name))].slice(0, 3);
                    return (
                      <div key={order.id} style={{ padding: 16, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16 }}>
                        <Link to={`/pedido/${order.id}`} className="flex items-start" style={{ gap: 12, textDecoration: "none", color: "inherit" }}>
                          <RestaurantAvatar iconKey={order.restaurants?.icon_key} colorVariant={order.restaurants?.color_variant} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="flex items-center justify-between" style={{ gap: 8 }}>
                              <span style={{ fontSize: 15.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {order.restaurants?.name || "Restaurante"}
                              </span>
                              {uniqueItemNames.length > 0 && (
                                <div className="flex items-center" style={{ flexShrink: 0 }}>
                                  {uniqueItemNames.map((name, i) => (
                                    <div key={name} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: uniqueItemNames.length - i }}>
                                      <ItemThumb name={name} />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1" style={{ marginTop: 2 }}>
                              {delivered ? <CheckCircle2 size={13} color={meta.color} /> :
                                <span style={{ width: 7, height: 7, borderRadius: 999, background: meta.color, flexShrink: 0 }} />}
                              <span style={{ fontSize: 12.5, fontWeight: 600, color: meta.color }}>{meta.label}</span>
                              <span style={{ fontSize: 12, color: C.grayText }}>· #{order.id.slice(0, 8)}</span>
                            </div>
                            {order.scheduled_for && (
                              <div style={{ fontSize: 12, fontWeight: 600, color: C.orange, marginTop: 3 }}>
                                Agendado para {new Date(order.scheduled_for).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              </div>
                            )}
                            <div style={{ fontSize: 13.5, color: C.grayText, marginTop: 8, lineHeight: 1.5 }}>
                              {items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>{formatBRL(order.total)}</div>
                          </div>
                        </Link>
                        <div className="flex items-center gap-3" style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12,
                             paddingLeft: 56, flexWrap: "wrap", rowGap: 6 }}>
                          <Link to={`/pedido/${order.id}`} style={{ color: C.grayText, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                            Acompanhar
                          </Link>
                          <button onClick={() => handleReorder(order)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: C.orange,
                                     fontFamily: FONT, fontSize: 13, fontWeight: 600, padding: 0 }}>
                            {reordered === order.id ? "Adicionado ao carrinho!" : "Pedir de novo"}
                          </button>
                          {delivered && (
                            reviewedMap[order.id] ? (
                              <span className="flex items-center gap-1" style={{ fontSize: 13, color: C.grayText, marginLeft: "auto", whiteSpace: "nowrap" }}>
                                <Star size={13} fill={C.orange} color={C.orange} /> Nota {reviewedMap[order.id].rating}
                              </span>
                            ) : (
                              <button onClick={() => setReviewOrder(order)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: C.orange,
                                         fontFamily: FONT, fontSize: 13, fontWeight: 600, padding: 0, marginLeft: "auto", whiteSpace: "nowrap" }}>
                                Avaliar pedido
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </PullToRefresh>

      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSaved={(review) => {
            setReviewedMap((m) => ({ ...m, [review.order_id]: review }));
            setReviewOrder(null);
          }}
        />
      )}
    </div>
  );
}
