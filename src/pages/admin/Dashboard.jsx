import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Store, Package, Bike, Wallet } from "lucide-react";
import { C, FONT, formatBRL } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { fetchProfile, fetchRestaurants, fetchAllOrdersAdmin, fetchAllDriversAdmin } from "../../data/queries";
import PortalHeader from "../../components/PortalHeader";

const STATUS_LABELS = {
  pending: "Recebido",
  preparing: "Em preparo",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

function LoadingScreen() {
  return (
    <div style={{ fontFamily: FONT, minHeight: "60vh", display: "grid", placeItems: "center" }}>
      <p style={{ color: C.grayText }}>Carregando…</p>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }) {
  return (
    <div style={{ flex: "1 1 160px", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.surface, display: "grid", placeItems: "center" }}>
          <Icon size={17} color={C.orange} />
        </div>
        <span style={{ fontSize: 13, color: C.grayText, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCheckingRole(false);
      return;
    }
    let cancelled = false;
    fetchProfile(user.id).then((profile) => {
      if (cancelled) return;
      setIsAdmin(profile?.role === "admin");
      setCheckingRole(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    Promise.all([fetchRestaurants(), fetchAllOrdersAdmin(), fetchAllDriversAdmin()]).then(([r, o, d]) => {
      if (cancelled) return;
      setRestaurants(r);
      setOrders(o);
      setDrivers(d);
      setLoadingData(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (authLoading || checkingRole) return <LoadingScreen />;
  if (!user || !isAdmin) return <Navigate to="/admin/entrar" replace />;
  if (loadingData) return <LoadingScreen />;

  const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const recentOrders = orders.slice(0, 15);

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <PortalHeader label="Painel Admin" />
      <section className="vp-wrap" style={{ padding: "32px 24px 100px", maxWidth: 900 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Visão geral</h1>

        <div className="flex" style={{ gap: 14, flexWrap: "wrap", marginBottom: 36 }}>
          <StatTile icon={Store} label="Restaurantes" value={restaurants.length} />
          <StatTile icon={Package} label="Pedidos" value={orders.length} />
          <StatTile icon={Wallet} label="Receita total" value={formatBRL(revenue)} />
          <StatTile icon={Bike} label="Entregadores" value={drivers.length} />
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Restaurantes</h2>
        {restaurants.length === 0 ? (
          <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum restaurante cadastrado ainda.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 36 }}>
            {restaurants.map((r) => (
              <div key={r.id} className="flex items-center justify-between" style={{ padding: "12px 16px",
                   background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12 }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 12.5, color: C.grayText }}>{r.category || "—"}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.orange, background: "rgba(238,108,26,.1)",
                     padding: "4px 10px", borderRadius: 999 }}>
                  {r.plan ? (r.plan === "entrega" ? "Entrega" : "Básico") : "Sem plano"}
                </span>
              </div>
            ))}
          </div>
        )}

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Entregadores</h2>
        {drivers.length === 0 ? (
          <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum entregador cadastrado ainda.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 36 }}>
            {drivers.map((d) => (
              <div key={d.id} className="flex items-center justify-between" style={{ padding: "12px 16px",
                   background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{d.full_name}</div>
                <div style={{ fontSize: 12.5, color: C.grayText }}>{d.vehicle_type}{d.plate ? ` · ${d.plate}` : ""}</div>
              </div>
            ))}
          </div>
        )}

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Pedidos recentes</h2>
        {recentOrders.length === 0 ? (
          <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum pedido ainda.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentOrders.map((o) => (
              <div key={o.id} style={{ padding: "12px 16px", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12 }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 14, fontWeight: 700 }}>#{o.id.slice(0, 8)} · {o.restaurants?.name}</span>
                  <span style={{ fontSize: 13, color: C.grayText }}>{new Date(o.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{formatBRL(o.total)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.grayText, background: C.surface,
                       padding: "4px 10px", borderRadius: 999 }}>
                    {STATUS_LABELS[o.status] || o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
