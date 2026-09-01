import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Store, Package, Bike, Wallet, TrendingUp, LayoutDashboard, ChevronLeft, ChevronRight,
  LogOut, Search, AlertTriangle, ArrowLeft, CheckCircle2, XCircle, Link2, Link2Off, Clock3,
} from "lucide-react";
import { C, FONT, formatBRL, RADIUS } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { fetchProfile, fetchRestaurants, fetchAllOrdersAdmin, fetchAllDriversAdmin } from "../../data/queries";
import { getCommissionRate, isInPromoPeriod } from "../../lib/commission";
import { STATUS_META, STATUS_OPTIONS } from "../../lib/orderStatus";
import { ICONS } from "../../data/icons";
import WORDMARK_DARK from "../../assets/wordmark-dark.png";
import { SkeletonPage } from "../../components/Skeleton";

function LoadingScreen() {
  return <SkeletonPage />;
}

const NAV_ITEMS = [
  { key: "geral", label: "Visão geral", icon: LayoutDashboard },
  { key: "restaurantes", label: "Restaurantes", icon: Store },
  { key: "pedidos", label: "Pedidos", icon: Package },
  { key: "entregadores", label: "Entregadores", icon: Bike },
];

function relativeTime(dateStr) {
  if (!dateStr) return "Nunca";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffH = diffMs / 3600000;
  if (diffH < 1) return "Agora há pouco";
  if (diffH < 24) return `Há ${Math.max(1, Math.round(diffH))}h`;
  return `Há ${Math.round(diffH / 24)}d`;
}

function buildDailySeries(orders, days = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.push({ key: d.toISOString().slice(0, 10), date: d, revenue: 0, count: 0 });
  }
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
  orders.forEach((o) => {
    const key = String(o.created_at).slice(0, 10);
    const bucket = byKey[key];
    if (bucket) {
      bucket.revenue += Number(o.total || 0);
      bucket.count += 1;
    }
  });
  return buckets;
}

function buildRestaurantHealth(restaurants, orders) {
  const map = new Map(restaurants.map((r) => [r.id, { restaurant: r, orderCount: 0, revenue: 0, lastOrderAt: null }]));
  orders.forEach((o) => {
    const entry = map.get(o.restaurant_id);
    if (!entry) return;
    entry.orderCount += 1;
    entry.revenue += Number(o.total || 0);
    if (!entry.lastOrderAt || new Date(o.created_at) > new Date(entry.lastOrderAt)) entry.lastOrderAt = o.created_at;
  });
  return [...map.values()];
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

function DailyBarChart({ data, valueKey = "revenue", formatValue = formatBRL, color = C.orange }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  const W = 640, H = 160, padBottom = 22, padTop = 10;
  const barGap = 3;
  const barW = (W / data.length) - barGap;

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block", overflow: "visible" }}
           preserveAspectRatio="none" role="img" aria-label={`Gráfico de ${valueKey === "revenue" ? "faturamento" : "pedidos"} nos últimos ${data.length} dias`}>
        <line x1="0" y1={H - padBottom} x2={W} y2={H - padBottom} stroke={C.line} strokeWidth="1" />
        {data.map((d, i) => {
          const v = d[valueKey];
          const barH = v > 0 ? Math.max(3, ((H - padTop - padBottom) * v) / max) : 0;
          const x = i * (barW + barGap);
          const y = H - padBottom - barH;
          const isHovered = hover === i;
          const showLabel = data.length <= 10 || i % Math.ceil(data.length / 7) === 0;
          return (
            <g key={d.key}>
              <rect x={x} y={y} width={Math.max(1, barW)} height={barH} rx={4} ry={4}
                    fill={isHovered ? C.orangeDark : color} opacity={isHovered ? 1 : 0.88}
                    onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
              <rect x={x} y={padTop} width={Math.max(1, barW)} height={H - padTop - padBottom} fill="transparent"
                    onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
              {showLabel && (
                <text x={x + barW / 2} y={H - 7} textAnchor="middle" fontSize="9" fill={C.grayText} fontFamily={FONT}>
                  {d.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div style={{ position: "absolute", left: `${((hover + 0.5) / data.length) * 100}%`, top: 0,
             transform: "translate(-50%, -100%)", background: C.black, color: "#fff", fontSize: 12, fontWeight: 600,
             padding: "6px 10px", borderRadius: RADIUS.sm, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 2 }}>
          {data[hover].date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {formatValue(data[hover][valueKey])}
        </div>
      )}
    </div>
  );
}

function AdminSidebar({ activeSection, onSectionChange, userEmail, onSignOut, collapsed, onToggleCollapsed }) {
  return (
    <aside className={`vp-portal-sidebar${collapsed ? " vp-portal-sidebar--collapsed" : ""}`}>
      <div className="flex items-center" style={{ justifyContent: collapsed ? "center" : "space-between",
           flexDirection: collapsed ? "column" : "row", gap: collapsed ? 10 : 8 }}>
        {collapsed ? (
          <div style={{ width: 32, height: 32, borderRadius: RADIUS.sm, background: C.black, display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>VP</div>
        ) : (
          <img src={WORDMARK_DARK} alt="Vem Provar" style={{ height: 30, width: "auto", display: "block" }} draggable={false} />
        )}
        <button onClick={onToggleCollapsed} className="vp-portal-collapse-btn"
          title={collapsed ? "Expandir menu" : "Recolher menu"} aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          style={{ width: 28, height: 28, borderRadius: RADIUS.xs, border: `1px solid ${C.line}`, background: "#fff",
                   cursor: "pointer", placeItems: "center", flexShrink: 0 }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <button onClick={onSignOut} className="vp-portal-signout-mobile" aria-label="Sair da conta"
          style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.line}`, background: "#fff",
                   cursor: "pointer", placeItems: "center" }}>
          <LogOut size={15} />
        </button>
      </div>

      {!collapsed && (
        <span style={{ fontSize: 12, fontWeight: 700, color: C.grayText, textTransform: "uppercase", letterSpacing: .4 }}>
          Painel Admin
        </span>
      )}

      <nav className="vp-portal-nav">
        {NAV_ITEMS.map((item) => {
          const ItemIcon = item.icon;
          const active = activeSection === item.key;
          return (
            <button key={item.key} onClick={() => onSectionChange(item.key)} title={item.label} aria-label={item.label} className="flex items-center gap-2"
              style={{ position: "relative", flexShrink: 0, background: active ? C.black : "none", color: active ? "#fff" : C.grayText,
                       border: "none", borderRadius: RADIUS.sm, cursor: "pointer", padding: collapsed ? "10px" : "10px 14px",
                       fontFamily: FONT, fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap",
                       justifyContent: collapsed ? "center" : "flex-start" }}>
              <ItemIcon size={16} /> {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      <div className="vp-portal-bottom" style={{ marginTop: "auto", flexDirection: "column", gap: 10, paddingTop: 14,
           borderTop: `1px solid ${C.line}`, alignItems: collapsed ? "center" : "stretch" }}>
        {!collapsed && (
          <span style={{ fontSize: 12, color: C.grayText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userEmail}
          </span>
        )}
        <button onClick={onSignOut} title="Sair" aria-label="Sair da conta" className="flex items-center gap-2"
          style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: RADIUS.sm, cursor: "pointer",
                   padding: collapsed ? "9px" : "9px 12px", fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.black,
                   justifyContent: "center" }}>
          <LogOut size={14} /> {!collapsed && "Sair"}
        </button>
      </div>
    </aside>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="flex items-center gap-2" style={{ background: C.surface, borderRadius: RADIUS.sm,
         padding: "0 12px", height: 40, maxWidth: 320 }}>
      <Search size={14} color={C.grayText} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ border: "none", outline: "none", flex: 1, background: "transparent", fontFamily: FONT, fontSize: 13.5 }} />
    </div>
  );
}

function FilterChip({ active, onClick, color = C.black, children }) {
  return (
    <button onClick={onClick}
      style={{ flexShrink: 0, background: active ? color : "#fff", color: active ? "#fff" : C.grayText,
               border: `1.5px solid ${active ? color : C.line}`, borderRadius: RADIUS.pill, cursor: "pointer",
               padding: "6px 13px", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

function RestaurantAvatar({ iconKey, size = 40 }) {
  const Icon = ICONS[iconKey] || Store;
  return (
    <div style={{ width: size, height: size, borderRadius: RADIUS.sm, background: C.surface, display: "grid",
         placeItems: "center", flexShrink: 0 }}>
      <Icon size={size * 0.45} color={C.grayText} />
    </div>
  );
}

function OrderRow({ order }) {
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  return (
    <div style={{ padding: 14, background: "#fff", border: `1px solid ${C.line}`,
         borderLeft: `4px solid ${meta.color}`, borderRadius: RADIUS.lg }}>
      <div className="flex items-center justify-between" style={{ gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>#{order.id.slice(0, 8)} · {order.restaurants?.name}</span>
        <span style={{ fontSize: 12.5, color: C.grayText }}>{new Date(order.created_at).toLocaleString("pt-BR")}</span>
      </div>
      <div className="flex items-center justify-between" style={{ marginTop: 8, flexWrap: "wrap", gap: 8 }}>
        <div>
          <span style={{ fontSize: 14.5, fontWeight: 700 }}>{formatBRL(order.total)}</span>
          {order.commission_amount != null && (
            <div style={{ fontSize: 12, color: C.grayText, marginTop: 2 }}>
              {Number(order.commission_amount) === 0 ? "sem comissão" : `comissão ${formatBRL(order.commission_amount)}`}
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
}

function RestaurantDetail({ health, orders, onBack }) {
  const { restaurant: r, orderCount, revenue, lastOrderAt } = health;
  const inPromo = isInPromoPeriod(r.promo_started_at);
  const rate = getCommissionRate(r);
  const ticket = orderCount > 0 ? revenue / orderCount : 0;
  const restaurantOrders = orders.filter((o) => o.restaurant_id === r.id).slice(0, 30);
  const series = useMemo(() => buildDailySeries(restaurantOrders), [restaurantOrders]);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2"
        style={{ background: "none", border: "none", cursor: "pointer", color: C.grayText, fontSize: 13.5, fontWeight: 600, padding: 0, marginBottom: 18 }}>
        <ArrowLeft size={16} /> Voltar pra Restaurantes
      </button>

      <div className="flex items-center gap-3" style={{ marginBottom: 18, flexWrap: "wrap" }}>
        <RestaurantAvatar iconKey={r.icon_key} size={52} />
        <div>
          <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{r.name}</h2>
            <span className="flex items-center gap-1" style={{ fontSize: 11.5, fontWeight: 700,
                 color: r.is_open !== false ? C.ok : "#B42318", background: r.is_open !== false ? "rgba(46,158,91,.1)" : "#FDECEC",
                 padding: "3px 9px", borderRadius: RADIUS.pill }}>
              {r.is_open !== false ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {r.is_open !== false ? "Aberta" : "Fechada"}
            </span>
            <span className="flex items-center gap-1" style={{ fontSize: 11.5, fontWeight: 700,
                 color: r.mp_connected ? C.ok : C.orange, background: r.mp_connected ? "rgba(46,158,91,.1)" : "rgba(238,108,26,.1)",
                 padding: "3px 9px", borderRadius: RADIUS.pill }}>
              {r.mp_connected ? <Link2 size={12} /> : <Link2Off size={12} />}
              {r.mp_connected ? "Mercado Pago conectado" : "Sem Mercado Pago"}
            </span>
          </div>
          <div style={{ fontSize: 13, color: C.grayText, marginTop: 2 }}>{r.category || "—"}</div>
        </div>
      </div>

      <div className="vp-dash-stats" style={{ marginBottom: 24 }}>
        <StatTile icon={Package} label="Pedidos" value={orderCount} />
        <StatTile icon={TrendingUp} label="Faturamento total" value={formatBRL(revenue)} accent />
        <StatTile icon={Wallet} label="Ticket médio" value={formatBRL(ticket)} />
        <StatTile icon={Clock3} label="Último pedido" value={relativeTime(lastOrderAt)} />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, color: C.grayText }}>
          Comissão: <strong style={{ color: C.black }}>{inPromo ? "0% (período promocional)" : `${rate}%`}</strong>
        </span>
        <span style={{ fontSize: 12.5, color: C.grayText }}>
          Plano: <strong style={{ color: C.black }}>{r.plan === "entrega" ? "Entrega" : "Básico"}</strong>
        </span>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Faturamento — últimos 14 dias</h3>
      <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.xl, padding: "18px 16px 10px", marginBottom: 28 }}>
        <DailyBarChart data={series} />
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Pedidos recentes</h3>
      {restaurantOrders.length === 0 ? (
        <p style={{ color: C.grayText, fontSize: 14 }}>Esse restaurante ainda não recebeu nenhum pedido.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {restaurantOrders.map((o) => <OrderRow key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [activeSection, setActiveSection] = useState("geral");
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("vp_admin_sidebar_collapsed") === "1"; } catch { return false; }
  });
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [restaurantFilter, setRestaurantFilter] = useState("all");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [driverSearch, setDriverSearch] = useState("");

  function toggleCollapsed() {
    setCollapsed((v) => {
      try { localStorage.setItem("vp_admin_sidebar_collapsed", v ? "0" : "1"); } catch { /* noop */ }
      return !v;
    });
  }

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

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  if (authLoading || checkingRole) return <LoadingScreen />;
  if (!user || !isAdmin) return <Navigate to="/admin/entrar" replace />;
  if (loadingData) return <LoadingScreen />;

  const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const commissionRevenue = orders.reduce((sum, o) => sum + Number(o.commission_amount ?? 0), 0);
  const dailySeries = buildDailySeries(orders);
  const health = buildRestaurantHealth(restaurants, orders);

  const noMpCount = restaurants.filter((r) => !r.mp_connected).length;
  const noOrdersCount = health.filter((h) => h.orderCount === 0).length;
  const closedCount = restaurants.filter((r) => r.is_open === false).length;

  function goToRestaurants(filter) {
    setSelectedRestaurantId(null);
    setRestaurantFilter(filter);
    setActiveSection("restaurantes");
  }

  const filteredHealth = health.filter((h) => {
    const q = restaurantSearch.trim().toLowerCase();
    if (q && !h.restaurant.name.toLowerCase().includes(q) && !(h.restaurant.category || "").toLowerCase().includes(q)) return false;
    if (restaurantFilter === "no_mp" && h.restaurant.mp_connected) return false;
    if (restaurantFilter === "no_orders" && h.orderCount > 0) return false;
    if (restaurantFilter === "closed" && h.restaurant.is_open !== false) return false;
    return true;
  }).sort((a, b) => b.revenue - a.revenue);

  const selectedHealth = selectedRestaurantId ? health.find((h) => h.restaurant.id === selectedRestaurantId) : null;

  const oq = orderSearch.trim().toLowerCase();
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
    if (!oq) return true;
    return o.id.toLowerCase().includes(oq) || (o.restaurants?.name || "").toLowerCase().includes(oq);
  });

  const dq = driverSearch.trim().toLowerCase();
  const filteredDrivers = drivers.filter((d) =>
    !dq || d.full_name.toLowerCase().includes(dq) || (d.vehicle_type || "").toLowerCase().includes(dq)
  );

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black }}>
      <div className="vp-portal-shell">
        <AdminSidebar activeSection={activeSection}
          onSectionChange={(key) => { setActiveSection(key); setSelectedRestaurantId(null); }}
          userEmail={user.email} onSignOut={handleSignOut} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />

        <main className="vp-portal-main">
          <div style={{ maxWidth: 1080 }}>

            {activeSection === "geral" && (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Visão geral</h1>

                <div className="vp-dash-stats" style={{ marginBottom: 24 }}>
                  <StatTile icon={Store} label="Restaurantes" value={restaurants.length} />
                  <StatTile icon={Bike} label="Entregadores" value={drivers.length} />
                  <StatTile icon={Package} label="Pedidos" value={orders.length} />
                  <StatTile icon={TrendingUp} label="Volume total (GMV)" value={formatBRL(revenue)} />
                  <StatTile icon={Wallet} label="Receita da plataforma" value={formatBRL(commissionRevenue)} accent />
                </div>

                {(noMpCount > 0 || noOrdersCount > 0 || closedCount > 0) && (
                  <div style={{ marginBottom: 28 }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                      <AlertTriangle size={16} color={C.orange} />
                      <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Precisa de atenção</h2>
                    </div>
                    <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                      {noMpCount > 0 && (
                        <button onClick={() => goToRestaurants("no_mp")} className="flex items-center gap-2"
                          style={{ background: "rgba(238,108,26,.08)", border: `1px solid ${C.orange}`, borderRadius: RADIUS.md,
                                   padding: "10px 14px", cursor: "pointer", fontFamily: FONT }}>
                          <Link2Off size={14} color={C.orange} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.black }}>
                            {noMpCount} restaurante{noMpCount > 1 ? "s" : ""} sem Mercado Pago conectado
                          </span>
                        </button>
                      )}
                      {noOrdersCount > 0 && (
                        <button onClick={() => goToRestaurants("no_orders")} className="flex items-center gap-2"
                          style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: RADIUS.md,
                                   padding: "10px 14px", cursor: "pointer", fontFamily: FONT }}>
                          <Package size={14} color={C.grayText} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.black }}>
                            {noOrdersCount} sem nenhum pedido ainda
                          </span>
                        </button>
                      )}
                      {closedCount > 0 && (
                        <button onClick={() => goToRestaurants("closed")} className="flex items-center gap-2"
                          style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: RADIUS.md,
                                   padding: "10px 14px", cursor: "pointer", fontFamily: FONT }}>
                          <XCircle size={14} color={C.grayText} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.black }}>
                            {closedCount} loja{closedCount > 1 ? "s" : ""} fechada{closedCount > 1 ? "s" : ""} agora
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Faturamento (GMV) — últimos 14 dias</h2>
                <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.xl, padding: "18px 16px 10px", marginBottom: 28 }}>
                  <DailyBarChart data={dailySeries} />
                </div>

                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Pedidos recentes</h2>
                {orders.length === 0 ? (
                  <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum pedido ainda.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {orders.slice(0, 8).map((o) => <OrderRow key={o.id} order={o} />)}
                  </div>
                )}
              </>
            )}

            {activeSection === "restaurantes" && (
              selectedHealth ? (
                <RestaurantDetail health={selectedHealth} orders={orders} onBack={() => setSelectedRestaurantId(null)} />
              ) : (
                <>
                  <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Restaurantes</h1>
                  <div className="flex items-center gap-2" style={{ marginBottom: 16, flexWrap: "wrap" }}>
                    <SearchBox value={restaurantSearch} onChange={setRestaurantSearch} placeholder="Buscar restaurante ou categoria" />
                    <FilterChip active={restaurantFilter === "all"} onClick={() => setRestaurantFilter("all")}>Todos</FilterChip>
                    <FilterChip active={restaurantFilter === "no_mp"} onClick={() => setRestaurantFilter("no_mp")} color={C.orange}>Sem MP</FilterChip>
                    <FilterChip active={restaurantFilter === "no_orders"} onClick={() => setRestaurantFilter("no_orders")}>Sem pedidos</FilterChip>
                    <FilterChip active={restaurantFilter === "closed"} onClick={() => setRestaurantFilter("closed")}>Fechados</FilterChip>
                  </div>

                  {filteredHealth.length === 0 ? (
                    <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum restaurante encontrado.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {filteredHealth.map((h) => {
                        const r = h.restaurant;
                        return (
                          <button key={r.id} onClick={() => setSelectedRestaurantId(r.id)} className="flex items-center vp-tap"
                            style={{ gap: 12, padding: 12, background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.lg,
                                     cursor: "pointer", textAlign: "left", width: "100%", fontFamily: FONT }}>
                            <RestaurantAvatar iconKey={r.icon_key} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                                <span style={{ fontSize: 14.5, fontWeight: 600 }}>{r.name}</span>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.is_open !== false ? C.ok : "#B42318", flexShrink: 0 }} />
                                {!r.mp_connected && <Link2Off size={12} color={C.orange} />}
                              </div>
                              <div style={{ fontSize: 12, color: C.grayText, marginTop: 2 }}>
                                {r.category || "—"} · Último pedido: {relativeTime(h.lastOrderAt)}
                              </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700 }}>{formatBRL(h.revenue)}</div>
                              <div style={{ fontSize: 12, color: C.grayText }}>{h.orderCount} pedido{h.orderCount === 1 ? "" : "s"}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )
            )}

            {activeSection === "pedidos" && (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Pedidos</h1>
                <div className="flex items-center gap-2 vp-scroll" style={{ marginBottom: 16, flexWrap: "nowrap", overflowX: "auto" }}>
                  <SearchBox value={orderSearch} onChange={setOrderSearch} placeholder="Buscar por restaurante ou nº do pedido" />
                  <FilterChip active={orderStatusFilter === "all"} onClick={() => setOrderStatusFilter("all")}>Todos</FilterChip>
                  {STATUS_OPTIONS.map((opt) => (
                    <FilterChip key={opt.value} active={orderStatusFilter === opt.value}
                      onClick={() => setOrderStatusFilter(opt.value)} color={STATUS_META[opt.value].color}>
                      {opt.label}
                    </FilterChip>
                  ))}
                </div>
                {filteredOrders.length === 0 ? (
                  <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum pedido encontrado.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filteredOrders.map((o) => <OrderRow key={o.id} order={o} />)}
                  </div>
                )}
              </>
            )}

            {activeSection === "entregadores" && (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Entregadores</h1>
                <div style={{ marginBottom: 16 }}>
                  <SearchBox value={driverSearch} onChange={setDriverSearch} placeholder="Buscar entregador" />
                </div>
                {filteredDrivers.length === 0 ? (
                  <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum entregador encontrado.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filteredDrivers.map((d) => (
                      <div key={d.id} className="flex items-center justify-between" style={{ padding: "12px 14px",
                           background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.md }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{d.full_name}</div>
                        <div style={{ fontSize: 12, color: C.grayText }}>{d.vehicle_type}{d.plate ? ` · ${d.plate}` : ""}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
