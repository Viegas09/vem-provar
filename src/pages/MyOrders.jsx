import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Package } from "lucide-react";
import { C, FONT, formatBRL } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { fetchOrdersForCustomer } from "../data/queries";
import { STATUS_META } from "../lib/orderStatus";
import Header from "../components/Header";
import { SkeletonPage } from "../components/Skeleton";

function LoadingScreen() {
  return <SkeletonPage />;
}

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [reordered, setReordered] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchOrdersForCustomer(user.id).then((data) => {
      setOrders(data);
      setLoadingOrders(false);
    });
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
  }

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <section className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: 640 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Meus pedidos</h1>

        {loadingOrders ? (
          <LoadingScreen />
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Package size={44} color={C.gray} style={{ margin: "0 auto 14px" }} />
            <p style={{ color: C.grayText, fontSize: 14.5, margin: "0 0 14px" }}>Você ainda não fez nenhum pedido.</p>
            <Link to="/" style={{ color: C.orange, fontWeight: 600, textDecoration: "none" }}>Ver restaurantes</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map((order) => {
              const meta = STATUS_META[order.status] || STATUS_META.pending;
              return (
              <div key={order.id} style={{ padding: 16, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16 }}>
                <Link to={`/pedido/${order.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{order.restaurants?.name || "Restaurante"}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, background: meta.bg,
                         padding: "4px 10px", borderRadius: 999 }}>
                      {meta.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 4 }}>
                    Nº {order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString("pt-BR")}
                  </div>
                  <div style={{ fontSize: 13.5, marginTop: 8 }}>
                    {(order.order_items || []).map((i) => `${i.qty}x ${i.name}`).join(", ")}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8 }}>{formatBRL(order.total)}</div>
                </Link>
                <div className="flex items-center gap-3" style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                  <Link to={`/pedido/${order.id}`} style={{ color: C.grayText, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                    Acompanhar
                  </Link>
                  <button onClick={() => handleReorder(order)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: C.orange,
                             fontFamily: FONT, fontSize: 13, fontWeight: 600, padding: 0 }}>
                    {reordered === order.id ? "Adicionado ao carrinho!" : "Pedir de novo"}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
