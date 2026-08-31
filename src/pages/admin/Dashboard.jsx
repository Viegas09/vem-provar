import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Store, Package, Bike, Wallet, TrendingUp } from "lucide-react";
import { C, FONT, formatBRL, RADIUS } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { fetchProfile, fetchRestaurants, fetchAllOrdersAdmin, fetchAllDriversAdmin } from "../../data/queries";
import { getCommissionRate, isInPromoPeriod } from "../../lib/commission";
import { STATUS_META } from "../../lib/orderStatus";
import PortalHeader from "../../components/PortalHeader";
import { SkeletonPage } from "../../components/Skeleton";

function LoadingScreen() {
  return <SkeletonPage />;
}

function StatTile({ icon: Icon, label, value, accent }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.xl, padding: 16 }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: accent ? "rgba(238,108,26,.1)" : C.surface,
             display: "grid", placeItems: "center" }}>
          <Icon size={15} color={accent ? C.orange : C.grayText} />
        </div>
        <span style={{ fontSize: 12, color: C.grayText, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 21, fontWeight: 700, color: accent ? C.orange : C.black }}>{value}</div>
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
  const commissionRevenue = orders.reduce((sum, o) => sum + Number(o.commission_amount ?? 0), 0);
  const recentOrders = orders.slice(0, 15);

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <PortalHeader label="Painel Admin" />
      <section className="vp-wrap" style={{ padding: "32px 24px 100px", maxWidth: 1080 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Visão geral</h1>

        <div className="vp-dash-stats" style={{ marginBottom: 28 }}>
          <StatTile icon={Store} label="Restaurantes" value={restaurants.length} />
          <StatTile icon={Bike} label="Entregadores" value={drivers.length} />
          <StatTile icon={Package} label="Pedidos" value={orders.length} />
          <StatTile icon={TrendingUp} label="Volume total (GMV)" value={formatBRL(revenue)} />
          <StatTile icon={Wallet} label="Receita da plataforma" value={formatBRL(commissionRevenue)} accent />
        </div>

        <div className="vp-dash-grid">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Pedidos recentes</h2>
            {recentOrders.length === 0 ? (
              <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum pedido ainda.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recentOrders.map((o) => {
                  const meta = STATUS_META[o.status] || STATUS_META.pending;
                  return (
                    <div key={o.id} style={{ padding: 14, background: "#fff", border: `1px solid ${C.line}`,
                         borderLeft: `4px solid ${meta.color}`, borderRadius: RADIUS.lg }}>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 14, fontWeight: 700 }}>#{o.id.slice(0, 8)} · {o.restaurants?.name}</span>
                        <span style={{ fontSize: 13, color: C.grayText }}>{new Date(o.created_at).toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="flex items-center justify-between" style={{ marginTop: 8, flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <span style={{ fontSize: 14.5, fontWeight: 700 }}>{formatBRL(o.total)}</span>
                          {o.commission_amount != null && (
                            <div style={{ fontSize: 12, color: C.grayText, marginTop: 2 }}>
                              {Number(o.commission_amount) === 0 ? "sem comissão" : `comissão ${formatBRL(o.commission_amount)}`}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, background: meta.bg,
                             padding: "5px 11px", borderRadius: RADIUS.pill }}>
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="vp-dash-side">
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Restaurantes</h2>
              {restaurants.length === 0 ? (
                <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum restaurante cadastrado ainda.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {restaurants.map((r) => {
                    const inPromo = isInPromoPeriod(r.promo_started_at);
                    const rate = getCommissionRate(r);
                    return (
                      <div key={r.id} className="flex items-center justify-between" style={{ padding: "12px 14px",
                           background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.md, gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.name}
                          </div>
                          <div style={{ fontSize: 12, color: C.grayText }}>{r.category || "—"}</div>
                        </div>
                        <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.orange, background: "rgba(238,108,26,.1)",
                               padding: "3px 8px", borderRadius: RADIUS.pill }}>
                            {r.plan ? (r.plan === "entrega" ? "Entrega" : "Básico") : "Sem plano"}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: inPromo ? C.ok : C.grayText,
                               background: inPromo ? "rgba(46,158,91,.1)" : C.surface, padding: "3px 8px", borderRadius: RADIUS.pill }}>
                            {inPromo ? "0% promo" : `${rate}%`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Entregadores</h2>
              {drivers.length === 0 ? (
                <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum entregador cadastrado ainda.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {drivers.map((d) => (
                    <div key={d.id} className="flex items-center justify-between" style={{ padding: "12px 14px",
                         background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.md }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{d.full_name}</div>
                      <div style={{ fontSize: 12, color: C.grayText }}>{d.vehicle_type}{d.plate ? ` · ${d.plate}` : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
