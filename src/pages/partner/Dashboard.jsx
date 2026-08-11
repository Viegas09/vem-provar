import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus, Trash2, Pencil, Store, Package, Wallet, CreditCard, CheckCircle2, XCircle, Receipt, TrendingUp,
  Clock3, Coins, Pause, Play, Home as HomeIcon, UtensilsCrossed, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { C, FONT, formatBRL } from "../../theme";
import { ICONS } from "../../data/icons";
import { useAuth } from "../../context/AuthContext";
import {
  fetchRestaurantByOwner, createMenuItem, updateMenuItem, deleteMenuItem, fetchOrdersForRestaurant,
  updateOrderStatus, updateRestaurant,
} from "../../data/queries";
import { getCommissionRate, isInPromoPeriod, promoEndsAt } from "../../lib/commission";
import { STATUS_META, STATUS_OPTIONS, OPEN_STATUSES } from "../../lib/orderStatus";
import { SkeletonPage } from "../../components/Skeleton";
import WORDMARK_DARK from "../../assets/wordmark-dark.png";

const KANBAN_STATUSES = ["pending", "preparing", "out_for_delivery", "delivered", "cancelled"];
const NAV_ITEMS = [
  { key: "inicio", label: "Início", icon: HomeIcon },
  { key: "financeiro", label: "Financeiro", icon: Wallet },
  { key: "cardapio", label: "Cardápio", icon: UtensilsCrossed },
];
const PERIOD_OPTIONS = [
  { value: "hoje", label: "Hoje" },
  { value: "7dias", label: "Últimos 7 dias" },
  { value: "tudo", label: "Tudo" },
];

function filterByPeriod(orders, period) {
  if (period === "tudo") return orders;
  const now = new Date();
  const cutoff = period === "hoje"
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
    : new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  return orders.filter((o) => new Date(o.created_at) >= cutoff);
}

function StatTile({ icon: Icon, label, value, accent }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 16 }}>
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

function MenuItemForm({ restaurantId, item, onSaved, onCancel }) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(item?.price ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (item) {
        await updateMenuItem(item.id, { name, description, price: Number(price) });
      } else {
        await createMenuItem({
          restaurant_id: restaurantId,
          name,
          description,
          price: Number(price),
          color_variant: Math.floor(Math.random() * 5),
        });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, background: C.surface,
         borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do item"
        style={{ border: `1.5px solid ${C.line}`, outline: "none", borderRadius: 10, padding: "10px 12px",
                 fontFamily: FONT, fontSize: 14.5, background: "#fff" }} />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição"
        style={{ border: `1.5px solid ${C.line}`, outline: "none", borderRadius: 10, padding: "10px 12px",
                 fontFamily: FONT, fontSize: 14.5, background: "#fff" }} />
      <input required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
        placeholder="Preço (R$)"
        style={{ border: `1.5px solid ${C.line}`, outline: "none", borderRadius: 10, padding: "10px 12px",
                 fontFamily: FONT, fontSize: 14.5, background: "#fff" }} />
      <div className="flex" style={{ gap: 10 }}>
        <button type="submit" disabled={saving}
          style={{ background: C.orange, color: "#fff", border: "none", cursor: "pointer", borderRadius: 10,
                   padding: "10px 18px", fontFamily: FONT, fontSize: 14, fontWeight: 600 }}>
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={onCancel}
          style={{ background: "none", border: `1px solid ${C.line}`, cursor: "pointer", borderRadius: 10,
                   padding: "10px 18px", fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.grayText }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function CommissionCard({ restaurant, orders }) {
  const rate = getCommissionRate(restaurant);
  const inPromo = isInPromoPeriod(restaurant.promo_started_at);
  const totalPayout = orders.reduce((sum, o) => sum + Number(o.restaurant_payout ?? o.total), 0);
  const totalCommission = orders.reduce((sum, o) => sum + Number(o.commission_amount ?? 0), 0);

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18, marginBottom: 8 }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
        <Wallet size={17} color={C.orange} />
        <span style={{ fontSize: 14.5, fontWeight: 700 }}>Sua comissão</span>
        {inPromo ? (
          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.ok, background: "rgba(46,158,91,.12)",
               padding: "3px 9px", borderRadius: 999 }}>
            0% até {promoEndsAt(restaurant.promo_started_at).toLocaleDateString("pt-BR")}
          </span>
        ) : (
          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.orange, background: "rgba(238,108,26,.1)",
               padding: "3px 9px", borderRadius: 999 }}>
            {rate}% por pedido
          </span>
        )}
      </div>
      <div className="flex" style={{ gap: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, color: C.grayText }}>Você já recebeu</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatBRL(totalPayout)}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: C.grayText }}>Comissão total paga</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.grayText }}>{formatBRL(totalCommission)}</div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: C.grayText, marginTop: 10, marginBottom: 0 }}>
        Repasse D+1 (Pix) / D+2 (cartão) · sem mensalidade · sem taxa de antecipação
      </p>
    </div>
  );
}

function RepasseLine({ label, sub, value, negative, bold, last }) {
  return (
    <div className="flex items-start justify-between" style={{ padding: "14px 16px", borderBottom: last ? "none" : `1px solid ${C.line}`, gap: 12 }}>
      <div>
        <div style={{ fontSize: bold ? 14.5 : 13.5, fontWeight: bold ? 700 : 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: C.grayText, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: bold ? 15 : 13.5, fontWeight: bold ? 700 : 600, color: negative ? "#B42318" : C.black, flexShrink: 0 }}>
        {value}
      </div>
    </div>
  );
}

function RepasseDetail({ restaurant, orders }) {
  const [period, setPeriod] = useState("tudo");
  const filtered = filterByPeriod(orders, period);
  const totalSales = filtered.reduce((sum, o) => sum + Number(o.total), 0);
  const totalCommission = filtered.reduce((sum, o) => sum + Number(o.commission_amount ?? 0), 0);
  const totalPayout = filtered.reduce((sum, o) => sum + Number(o.restaurant_payout ?? o.total), 0);
  const rate = getCommissionRate(restaurant);

  return (
    <div>
      <div className="vp-scroll flex items-center gap-2" style={{ marginBottom: 18 }}>
        {PERIOD_OPTIONS.map((opt) => {
          const active = period === opt.value;
          return (
            <button key={opt.value} onClick={() => setPeriod(opt.value)}
              style={{ flexShrink: 0, background: active ? C.black : "#fff", color: active ? "#fff" : C.grayText,
                       border: `1.5px solid ${active ? C.black : C.line}`, borderRadius: 999, cursor: "pointer",
                       padding: "7px 14px", fontFamily: FONT, fontSize: 13, fontWeight: 600 }}>
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="vp-dash-grid" style={{ marginBottom: 28 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 13, color: C.grayText, fontWeight: 600 }}>Valor a receber</div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 6 }}>{formatBRL(totalPayout)}</div>
          <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 10 }}>
            Repasse D+1 (Pix) / D+2 (cartão) direto na sua conta conectada.
          </div>
        </div>
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16 }}>
          <RepasseLine label="Total de vendas no período" sub={`${filtered.length} pedido${filtered.length === 1 ? "" : "s"}`} value={formatBRL(totalSales)} />
          <RepasseLine label={`Comissão Vem Provar (${rate}%)`} sub="Sem taxa escondida, sem mensalidade" value={`- ${formatBRL(totalCommission)}`} negative />
          <RepasseLine label="Total" value={formatBRL(totalPayout)} bold last />
        </div>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Pedidos do período</h3>
      {filtered.length === 0 ? (
        <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum pedido nesse período.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((o) => (
            <div key={o.id} className="flex items-center justify-between" style={{ padding: "10px 14px", background: "#fff",
                 border: `1px solid ${C.line}`, borderRadius: 12, flexWrap: "wrap", gap: 8 }}>
              <div>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>#{o.id.slice(0, 8)}</span>
                <span style={{ fontSize: 12.5, color: C.grayText, marginLeft: 8 }}>
                  {new Date(o.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 13, color: C.grayText }}>{formatBRL(o.total)}</span>
                <span style={{ fontSize: 13, color: "#B42318" }}>- {formatBRL(o.commission_amount || 0)}</span>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ok }}>{formatBRL(o.restaurant_payout ?? o.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onStatusChange }) {
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  return (
    <div style={{ padding: 14, background: "#fff", border: `1px solid ${C.line}`,
         borderLeft: `4px solid ${meta.color}`, borderRadius: 14 }}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 14, fontWeight: 700 }}>#{order.id.slice(0, 8)}</span>
        <span style={{ fontSize: 12, color: C.grayText }}>
          {new Date(order.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <div style={{ fontSize: 13, color: C.grayText, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {order.address}
      </div>
      <div style={{ marginTop: 8 }}>
        {(order.order_items || []).map((i) => (
          <div key={i.id} style={{ fontSize: 13, marginBottom: 2 }}>
            {i.qty}x {i.name}
            {i.notes && <span style={{ color: C.orange, fontStyle: "italic" }}> — Obs: {i.notes}</span>}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{formatBRL(order.total)}</span>
        {order.restaurant_payout != null && (
          <div style={{ fontSize: 11.5, color: C.ok, marginTop: 2 }}>
            Você recebe {formatBRL(order.restaurant_payout)}
            {Number(order.commission_amount) === 0 ? " · sem comissão" : ` · comissão ${formatBRL(order.commission_amount)}`}
          </div>
        )}
      </div>
      <select value={order.status} onChange={(e) => onStatusChange(order.id, e.target.value)}
        style={{ width: "100%", marginTop: 10, border: `1.5px solid ${meta.color}`, outline: "none", borderRadius: 8,
                 padding: "6px 8px", fontFamily: FONT, fontSize: 12.5, fontWeight: 700, background: meta.bg,
                 color: meta.color, cursor: "pointer" }}>
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}

function MercadoPagoCard({ restaurant }) {
  const clientId = import.meta.env.VITE_MP_CLIENT_ID;

  if (restaurant.mp_connected) {
    return (
      <div className="flex items-center gap-2" style={{ background: "rgba(46,158,91,.08)", border: `1px solid ${C.line}`,
           borderRadius: 14, padding: "12px 16px", marginBottom: 14 }}>
        <CheckCircle2 size={17} color={C.ok} />
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>Mercado Pago conectado — você já pode receber pagamentos online.</span>
      </div>
    );
  }

  const authorizeUrl = clientId
    ? `https://auth.mercadopago.com.br/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${restaurant.id}&redirect_uri=${encodeURIComponent(`${window.location.origin}/api/mp-oauth-callback`)}`
    : null;

  return (
    <div style={{ background: "#fff", border: `1.5px solid ${C.orange}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
        <CreditCard size={17} color={C.orange} />
        <span style={{ fontSize: 14, fontWeight: 700 }}>Conecte o Mercado Pago pra receber pagamentos online</span>
      </div>
      <p style={{ fontSize: 13, color: C.grayText, margin: "0 0 12px" }}>
        Sem isso, os clientes só podem pagar na entrega. Leva 1 minuto e o dinheiro cai direto na sua própria conta.
      </p>
      <a href={authorizeUrl || "#"} aria-disabled={!authorizeUrl}
        style={{ display: "inline-block", background: authorizeUrl ? C.orange : C.gray, color: "#fff", textDecoration: "none",
                 borderRadius: 10, padding: "9px 18px", fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
                 pointerEvents: authorizeUrl ? "auto" : "none" }}>
        Conectar Mercado Pago
      </a>
    </div>
  );
}

function PartnerSidebar({ restaurant, activeSection, onSectionChange, onToggleOpen, userEmail, onSignOut, collapsed, onToggleCollapsed }) {
  const isOpen = restaurant.is_open !== false;
  return (
    <aside className={`vp-portal-sidebar${collapsed ? " vp-portal-sidebar--collapsed" : ""}`}>
      <div className="flex items-center" style={{ justifyContent: collapsed ? "center" : "space-between",
           flexDirection: collapsed ? "column" : "row", gap: collapsed ? 10 : 8 }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          {collapsed ? (
            <div style={{ width: 32, height: 32, borderRadius: 9, background: C.orange, display: "grid",
                 placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 12.5 }}>
              VP
            </div>
          ) : (
            <img src={WORDMARK_DARK} alt="Vem Provar" style={{ height: 30, width: "auto", display: "block" }} draggable={false} />
          )}
        </Link>
        <button onClick={onToggleCollapsed} className="vp-portal-collapse-btn" title={collapsed ? "Expandir menu" : "Recolher menu"}
          style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff",
                   cursor: "pointer", placeItems: "center", flexShrink: 0 }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <button onClick={onSignOut} className="vp-portal-signout-mobile"
          style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.line}`, background: "#fff",
                   cursor: "pointer", placeItems: "center" }}>
          <LogOut size={15} />
        </button>
      </div>

      <button onClick={onToggleOpen} className="flex items-center gap-2"
        title={isOpen ? "Loja aberta — clique para fechar" : "Loja fechada — clique para reabrir"}
        style={{ background: isOpen ? "rgba(46,158,91,.1)" : "rgba(180,35,24,.08)",
                 border: `1px solid ${isOpen ? C.ok : "#B42318"}`, borderRadius: 12,
                 padding: collapsed ? "10px" : "10px 12px", cursor: "pointer", textAlign: "left", width: "100%",
                 justifyContent: collapsed ? "center" : "flex-start" }}>
        {isOpen ? <CheckCircle2 size={17} color={C.ok} style={{ flexShrink: 0 }} /> : <XCircle size={17} color="#B42318" style={{ flexShrink: 0 }} />}
        {!collapsed && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: isOpen ? C.ok : "#B42318" }}>
              {isOpen ? "Loja aberta" : "Loja fechada"}
            </div>
            <div style={{ fontSize: 11, color: C.grayText }}>
              {isOpen ? "Clique para fechar" : "Clique para reabrir"}
            </div>
          </div>
        )}
      </button>

      <nav className="vp-portal-nav">
        {NAV_ITEMS.map((item) => {
          const ItemIcon = item.icon;
          const active = activeSection === item.key;
          return (
            <button key={item.key} onClick={() => onSectionChange(item.key)} title={item.label} className="flex items-center gap-2"
              style={{ flexShrink: 0, background: active ? C.black : "none", color: active ? "#fff" : C.grayText,
                       border: "none", borderRadius: 10, cursor: "pointer", padding: collapsed ? "10px" : "10px 14px",
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
        <button onClick={onSignOut} title="Sair" className="flex items-center gap-2"
          style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 10, cursor: "pointer",
                   padding: collapsed ? "9px" : "9px 12px", fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.black,
                   justifyContent: "center" }}>
          <LogOut size={14} /> {!collapsed && "Sair"}
        </button>
      </div>
    </aside>
  );
}

export default function PartnerDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeSection, setActiveSection] = useState("inicio");
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("vp_sidebar_collapsed") === "1");
  const mpStatus = searchParams.get("mp");

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("vp_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }

  async function reload() {
    const r = await fetchRestaurantByOwner(user.id);
    setRestaurant(r);
    if (r) {
      const o = await fetchOrdersForRestaurant(r.id);
      setOrders(o);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user) reload();
  }, [user]);

  if (authLoading) return <SkeletonPage />;
  if (!user) return <Navigate to="/parceiro/entrar" replace />;
  if (loading) return <SkeletonPage />;
  if (!restaurant) return <Navigate to="/parceiro/cadastro" replace />;

  const Icon = ICONS[restaurant.icon_key] || Store;

  async function handleDelete(itemId) {
    if (!window.confirm("Remover esse item do cardápio?")) return;
    await deleteMenuItem(itemId);
    reload();
  }

  async function handleStatusChange(orderId, status) {
    await updateOrderStatus(orderId, status);
    reload();
  }

  async function handleToggleAvailable(item) {
    await updateMenuItem(item.id, { available: item.available === false });
    reload();
  }

  async function handleToggleOpen() {
    await updateRestaurant(restaurant.id, { is_open: restaurant.is_open === false });
    reload();
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  const todayKey = new Date().toDateString();
  const todaysOrders = orders.filter((o) => new Date(o.created_at).toDateString() === todayKey);
  const todayRevenue = todaysOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const openOrdersCount = orders.filter((o) => OPEN_STATUSES.includes(o.status)).length;
  const totalPayout = orders.reduce((sum, o) => sum + Number(o.restaurant_payout ?? o.total), 0);
  const avgTicket = orders.length > 0 ? orders.reduce((sum, o) => sum + Number(o.total), 0) / orders.length : 0;
  const ordersByStatus = KANBAN_STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s);
    return acc;
  }, {});

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black }}>
      <div className="vp-portal-shell">
        <PartnerSidebar restaurant={restaurant} activeSection={activeSection} onSectionChange={setActiveSection}
          onToggleOpen={handleToggleOpen} userEmail={user.email} onSignOut={handleSignOut}
          collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />

        <main className="vp-portal-main">
          <div style={{ maxWidth: 1000 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.orange, display: "grid", placeItems: "center" }}>
                <Icon size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{restaurant.name}</h1>
                <div style={{ fontSize: 13, color: C.grayText }}>{restaurant.category}</div>
              </div>
            </div>

            {mpStatus === "connected" && (
              <div style={{ background: "rgba(46,158,91,.1)", color: C.ok, borderRadius: 12, padding: "10px 14px",
                   fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>
                Mercado Pago conectado com sucesso!
              </div>
            )}
            {mpStatus === "error" && (
              <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: 12, padding: "10px 14px",
                   fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>
                Não foi possível conectar o Mercado Pago. Tente novamente.
              </div>
            )}

            {activeSection === "inicio" && (
              <>
                <div className="vp-dash-stats" style={{ marginBottom: 28 }}>
                  <StatTile icon={Receipt} label="Pedidos hoje" value={todaysOrders.length} />
                  <StatTile icon={TrendingUp} label="Faturamento hoje" value={formatBRL(todayRevenue)} />
                  <StatTile icon={Clock3} label="Em aberto" value={openOrdersCount} accent={openOrdersCount > 0} />
                  <StatTile icon={Coins} label="Ticket médio" value={formatBRL(avgTicket)} />
                  <StatTile icon={Wallet} label="Você recebeu" value={formatBRL(totalPayout)} />
                </div>

                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Pedidos recebidos</h2>
                {orders.length === 0 ? (
                  <p style={{ color: C.grayText, fontSize: 14 }} className="flex items-center gap-2">
                    <Package size={16} /> Nenhum pedido ainda.
                  </p>
                ) : (
                  <div className="vp-scroll" style={{ display: "flex", gap: 14, alignItems: "flex-start", paddingBottom: 6 }}>
                    {KANBAN_STATUSES.map((status) => {
                      const meta = STATUS_META[status];
                      const list = ordersByStatus[status];
                      return (
                        <div key={status} style={{ flexShrink: 0, width: 270 }}>
                          <div className="flex items-center gap-2" style={{ marginBottom: 10, padding: "0 2px" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: meta.color, background: meta.bg,
                                 borderRadius: 999, minWidth: 20, height: 20, display: "grid", placeItems: "center", padding: "0 6px" }}>
                              {list.length}
                            </span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {list.length === 0 ? (
                              <div style={{ border: `1.5px dashed ${C.line}`, borderRadius: 14, padding: 16, textAlign: "center" }}>
                                <span style={{ fontSize: 12.5, color: C.grayText }}>Vazio</span>
                              </div>
                            ) : (
                              list.map((order) => <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />)
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeSection === "financeiro" && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 18px" }}>Financeiro</h2>
                <MercadoPagoCard restaurant={restaurant} />
                <CommissionCard restaurant={restaurant} orders={orders} />
                <div style={{ marginTop: 28 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>Detalhamento do repasse</h3>
                  <RepasseDetail restaurant={restaurant} orders={orders} />
                </div>
              </>
            )}

            {activeSection === "cardapio" && (
              <>
                <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Cardápio</h2>
                  {!showAddForm && (
                    <button onClick={() => setShowAddForm(true)} className="flex items-center gap-1"
                      style={{ background: C.orange, color: "#fff", border: "none", cursor: "pointer", borderRadius: 10,
                               padding: "9px 16px", fontFamily: FONT, fontSize: 13.5, fontWeight: 600 }}>
                      <Plus size={15} /> Adicionar item
                    </button>
                  )}
                </div>

                {showAddForm && (
                  <MenuItemForm restaurantId={restaurant.id}
                    onSaved={() => { setShowAddForm(false); reload(); }}
                    onCancel={() => setShowAddForm(false)} />
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(restaurant.menu_items || []).length === 0 && !showAddForm && (
                    <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum item cadastrado ainda.</p>
                  )}
                  {(restaurant.menu_items || []).map((item) =>
                    editingItem === item.id ? (
                      <MenuItemForm key={item.id} restaurantId={restaurant.id} item={item}
                        onSaved={() => { setEditingItem(null); reload(); }}
                        onCancel={() => setEditingItem(null)} />
                    ) : (
                      <div key={item.id} style={{ padding: 14, background: "#fff",
                           border: `1px solid ${C.line}`, borderRadius: 14, opacity: item.available === false ? 0.55 : 1 }}>
                        <div className="flex items-center" style={{ gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</span>
                              {item.available === false && (
                                <span style={{ fontSize: 10.5, fontWeight: 700, color: C.grayText, background: C.surface,
                                     padding: "2px 7px", borderRadius: 999, flexShrink: 0 }}>
                                  Pausado
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 13, color: C.grayText }}>
                              {item.description}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{formatBRL(item.price)}</div>
                          </div>
                          <button onClick={() => setEditingItem(item.id)}
                            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff",
                                     cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(item.id)}
                            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff",
                                     cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
                            <Trash2 size={15} color="#B42318" />
                          </button>
                        </div>
                        <button onClick={() => handleToggleAvailable(item)} className="flex items-center justify-center gap-1"
                          style={{ width: "100%", marginTop: 12, background: "none", border: `1px solid ${C.line}`,
                                   borderRadius: 8, cursor: "pointer", padding: "8px 0", fontFamily: FONT, fontSize: 13,
                                   fontWeight: 600, color: item.available === false ? C.ok : C.grayText }}>
                          {item.available === false ? <><Play size={14} /> Retomar vendas</> : <><Pause size={14} /> Pausar vendas</>}
                        </button>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
