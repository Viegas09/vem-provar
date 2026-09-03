import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Store, Package, Bike, Wallet, TrendingUp, LayoutDashboard, ChevronLeft, ChevronRight,
  LogOut, Search, AlertTriangle, ArrowLeft, CheckCircle2, XCircle, Link2, Link2Off, Clock3,
  Receipt, Download, TicketPercent, ShieldOff, ShieldCheck, Users, Ban, Star, EyeOff, Eye,
  Image, ImageOff, Trash2, Plus,
} from "lucide-react";
import { C, FONT, formatBRL, RADIUS } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  fetchProfile, fetchAllRestaurantsAdmin, fetchAllOrdersAdmin, fetchAllDriversAdmin,
  updateOrderStatus, updateRestaurant, fetchProfilesByIds, updateProfile,
  fetchAllReviewsAdmin, updateReview, updateMenuItem, fetchPlatformCoupons, updateCoupon,
} from "../../data/queries";
import { getCommissionRate, isInPromoPeriod } from "../../lib/commission";
import { STATUS_META, STATUS_OPTIONS, NEXT_STATUS, OPEN_STATUSES } from "../../lib/orderStatus";
import { ICONS } from "../../data/icons";
import WORDMARK_DARK from "../../assets/wordmark-dark.png";
import { SkeletonPage } from "../../components/Skeleton";
import { useOrdersRealtime } from "../../hooks/useOrdersRealtime";
import CouponForm from "../../components/CouponForm";

const ADMIN_ORDERS_KEY = ["admin", "orders"];
const ADMIN_RESTAURANTS_KEY = ["admin", "restaurants"];
const ADMIN_DRIVERS_KEY = ["admin", "drivers"];
const ADMIN_REVIEWS_KEY = ["admin", "reviews"];
const ADMIN_COUPONS_KEY = ["admin", "coupons"];

function LoadingScreen() {
  return <SkeletonPage />;
}

const NAV_ITEMS = [
  { key: "geral", label: "Visão geral", icon: LayoutDashboard },
  { key: "restaurantes", label: "Restaurantes", icon: Store },
  { key: "pedidos", label: "Pedidos", icon: Package },
  { key: "financeiro", label: "Financeiro", icon: Receipt },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "entregadores", label: "Entregadores", icon: Bike },
  { key: "avaliacoes", label: "Avaliações", icon: Star },
  { key: "cupons", label: "Cupons", icon: TicketPercent },
];

const PAYMENT_STATUS_META = {
  simulated: { label: "Na entrega", color: C.grayText, bg: C.surface },
  approved: { label: "Pago", color: C.ok, bg: "rgba(46,158,91,.1)" },
  pending: { label: "Pendente", color: C.orange, bg: "rgba(238,108,26,.1)" },
  in_process: { label: "Pendente", color: C.orange, bg: "rgba(238,108,26,.1)" },
  authorized: { label: "Pendente", color: C.orange, bg: "rgba(238,108,26,.1)" },
  rejected: { label: "Recusado", color: "#B42318", bg: "#FDECEC" },
  cancelled: { label: "Cancelado", color: "#B42318", bg: "#FDECEC" },
  refunded: { label: "Estornado", color: "#B42318", bg: "#FDECEC" },
  charged_back: { label: "Estornado", color: "#B42318", bg: "#FDECEC" },
};

function paymentStatusMeta(status) {
  return PAYMENT_STATUS_META[status] || PAYMENT_STATUS_META.simulated;
}

const ONLINE_PAYMENT_METHODS = ["pix", "card_online"];

function isConfirmedOrder(o) {
  if (o.status === "cancelled") return false;
  if (!ONLINE_PAYMENT_METHODS.includes(o.payment_method)) return true; // dinheiro/cartão na entrega: confia no repasse na entrega
  return o.payment_status === "approved";
}

const FINANCE_PERIODS = [
  { key: "7", label: "7 dias", days: 7 },
  { key: "30", label: "30 dias", days: 30 },
  { key: "90", label: "90 dias", days: 90 },
  { key: "all", label: "Tudo", days: null },
];

function filterByPeriod(orders, periodKey) {
  const period = FINANCE_PERIODS.find((p) => p.key === periodKey);
  if (!period || period.days == null) return orders;
  const cutoff = Date.now() - period.days * 86400000;
  return orders.filter((o) => new Date(o.created_at).getTime() >= cutoff);
}

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(filename, headers, rows) {
  const lines = [headers.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))];
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildRestaurantFinance(restaurants, orders) {
  const map = new Map(restaurants.map((r) => [r.id, {
    restaurant: r, orderCount: 0, gmv: 0, commission: 0, payout: 0, discount: 0,
  }]));
  orders.forEach((o) => {
    const entry = map.get(o.restaurant_id);
    if (!entry || !isConfirmedOrder(o)) return;
    entry.orderCount += 1;
    entry.gmv += Number(o.total || 0);
    entry.commission += Number(o.commission_amount || 0);
    entry.payout += Number(o.restaurant_payout ?? (o.total - (o.commission_amount || 0)));
    entry.discount += Number(o.discount_amount || 0);
  });
  return [...map.values()];
}

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

function buildCustomerHealth(profiles, orders) {
  const map = new Map(profiles.map((p) => [p.id, { profile: p, orderCount: 0, cancelledCount: 0, spend: 0, lastOrderAt: null }]));
  orders.forEach((o) => {
    const entry = map.get(o.customer_id);
    if (!entry) return;
    entry.orderCount += 1;
    if (o.status === "cancelled") entry.cancelledCount += 1;
    else entry.spend += Number(o.total || 0);
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

function OrderRow({ order, onAdvance, onCancel, working }) {
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const next = NEXT_STATUS[order.status];
  const canIntervene = (onAdvance || onCancel) && order.status !== "delivered" && order.status !== "cancelled";
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
      {canIntervene && (
        <div className="flex items-center gap-2" style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}`, flexWrap: "wrap" }}>
          {next && onAdvance && (
            <button disabled={working} onClick={() => onAdvance(order, next.value)}
              style={{ background: C.black, color: "#fff", border: "none", borderRadius: RADIUS.xs,
                       cursor: working ? "default" : "pointer", padding: "7px 12px", fontFamily: FONT, fontSize: 12.5,
                       fontWeight: 600, opacity: working ? .6 : 1 }}>
              {next.label}
            </button>
          )}
          {onCancel && (
            <button disabled={working} onClick={() => onCancel(order)}
              style={{ background: "#fff", color: "#B42318", border: "1px solid #B42318", borderRadius: RADIUS.xs,
                       cursor: working ? "default" : "pointer", padding: "7px 12px", fontFamily: FONT, fontSize: 12.5,
                       fontWeight: 600, opacity: working ? .6 : 1 }}>
              Cancelar pedido
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PaymentIssueRow({ order }) {
  const meta = paymentStatusMeta(order.payment_status);
  const methodLabel = order.payment_method === "pix" ? "Pix" : order.payment_method === "card_online" ? "Cartão online" : order.payment_method;
  return (
    <div className="flex items-center justify-between" style={{ padding: 14, background: "#fff", border: `1px solid ${C.line}`,
         borderLeft: `4px solid ${meta.color}`, borderRadius: RADIUS.lg, gap: 10, flexWrap: "wrap" }}>
      <div style={{ minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>#{order.id.slice(0, 8)} · {order.restaurants?.name}</span>
        <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 2 }}>
          {methodLabel} · {formatBRL(order.total)} · {new Date(order.created_at).toLocaleString("pt-BR")}
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, background: meta.bg,
           padding: "5px 11px", borderRadius: RADIUS.pill, flexShrink: 0 }}>
        {meta.label}
      </span>
    </div>
  );
}

function PhotoTile({ label, url, onRemove, working }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ width: "100%", aspectRatio: "1", borderRadius: RADIUS.md, overflow: "hidden",
           background: C.surface, display: "grid", placeItems: "center" }}>
        {url ? (
          <img src={url} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Image size={22} color={C.gray} />
        )}
      </div>
      <div style={{ fontSize: 11.5, color: C.grayText, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </div>
      {url && (
        <button disabled={working} onClick={onRemove} title="Remover foto" aria-label={`Remover foto de ${label}`}
          style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: "50%",
                   background: "rgba(20,20,20,.7)", border: "none", cursor: working ? "default" : "pointer",
                   display: "grid", placeItems: "center", opacity: working ? .6 : 1 }}>
          <Trash2 size={13} color="#fff" />
        </button>
      )}
    </div>
  );
}

function PhotoModeration({ restaurant, menuItems, onRemoveBanner, onRemoveMenuItemPhoto, workingPhotoKey }) {
  const withPhotos = menuItems.filter((i) => i.image_url);
  if (!restaurant.banner_url && withPhotos.length === 0) {
    return <p style={{ color: C.grayText, fontSize: 14 }} className="flex items-center gap-2"><ImageOff size={16} /> Esse restaurante não tem fotos enviadas.</p>;
  }
  return (
    <div className="vp-card-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
      {restaurant.banner_url && (
        <PhotoTile label="Capa da loja" url={restaurant.banner_url}
          working={workingPhotoKey === "banner"} onRemove={() => onRemoveBanner(restaurant)} />
      )}
      {withPhotos.map((item) => (
        <PhotoTile key={item.id} label={item.name} url={item.image_url}
          working={workingPhotoKey === item.id} onRemove={() => onRemoveMenuItemPhoto(item)} />
      ))}
    </div>
  );
}

function RestaurantDetail({ health, orders, onBack, onAdvance, onCancel, workingOrderId, onSuspend, onReactivate, workingRestaurantId, onRemoveBanner, onRemoveMenuItemPhoto, workingPhotoKey }) {
  const { restaurant: r, orderCount, revenue, lastOrderAt } = health;
  const inPromo = isInPromoPeriod(r.promo_started_at);
  const rate = getCommissionRate(r);
  const ticket = orderCount > 0 ? revenue / orderCount : 0;
  const restaurantOrders = orders.filter((o) => o.restaurant_id === r.id).slice(0, 30);
  const series = useMemo(() => buildDailySeries(restaurantOrders), [restaurantOrders]);
  const busy = workingRestaurantId === r.id;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2"
        style={{ background: "none", border: "none", cursor: "pointer", color: C.grayText, fontSize: 13.5, fontWeight: 600, padding: 0, marginBottom: 18 }}>
        <ArrowLeft size={16} /> Voltar pra Restaurantes
      </button>

      <div className="flex items-center justify-between" style={{ marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
          <RestaurantAvatar iconKey={r.icon_key} size={52} />
          <div>
            <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{r.name}</h2>
              {r.suspended && (
                <span className="flex items-center gap-1" style={{ fontSize: 11.5, fontWeight: 700,
                     color: "#B42318", background: "#FDECEC", padding: "3px 9px", borderRadius: RADIUS.pill }}>
                  <ShieldOff size={12} /> Suspenso pela plataforma
                </span>
              )}
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
            {r.suspended && r.suspension_reason && (
              <div style={{ fontSize: 12.5, color: "#B42318", marginTop: 4 }}>Motivo: {r.suspension_reason}</div>
            )}
          </div>
        </div>
        {r.suspended ? (
          <button disabled={busy} onClick={() => onReactivate(r)} className="flex items-center gap-2"
            style={{ background: C.ok, color: "#fff", border: "none", borderRadius: RADIUS.sm, cursor: busy ? "default" : "pointer",
                     padding: "9px 14px", fontFamily: FONT, fontSize: 13, fontWeight: 600, opacity: busy ? .6 : 1, flexShrink: 0 }}>
            <ShieldCheck size={14} /> Reativar restaurante
          </button>
        ) : (
          <button disabled={busy} onClick={() => onSuspend(r)} className="flex items-center gap-2"
            style={{ background: "#fff", color: "#B42318", border: "1px solid #B42318", borderRadius: RADIUS.sm, cursor: busy ? "default" : "pointer",
                     padding: "9px 14px", fontFamily: FONT, fontSize: 13, fontWeight: 600, opacity: busy ? .6 : 1, flexShrink: 0 }}>
            <ShieldOff size={14} /> Suspender restaurante
          </button>
        )}
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

      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Fotos</h3>
      <p style={{ fontSize: 12.5, color: C.grayText, margin: "-6px 0 12px" }}>
        Remove foto de capa ou de prato impróprias — o restaurante pode reenviar outra depois.
      </p>
      <div style={{ marginBottom: 28 }}>
        <PhotoModeration restaurant={r} menuItems={r.menu_items || []}
          onRemoveBanner={onRemoveBanner} onRemoveMenuItemPhoto={onRemoveMenuItemPhoto} workingPhotoKey={workingPhotoKey} />
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Pedidos recentes</h3>
      {restaurantOrders.length === 0 ? (
        <p style={{ color: C.grayText, fontSize: 14 }}>Esse restaurante ainda não recebeu nenhum pedido.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {restaurantOrders.map((o) => (
            <OrderRow key={o.id} order={o} onAdvance={onAdvance} onCancel={onCancel} working={workingOrderId === o.id} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const restaurantsQuery = useQuery({ queryKey: ADMIN_RESTAURANTS_KEY, queryFn: fetchAllRestaurantsAdmin, enabled: isAdmin });
  const ordersQuery = useQuery({ queryKey: ADMIN_ORDERS_KEY, queryFn: fetchAllOrdersAdmin, enabled: isAdmin });
  const driversQuery = useQuery({ queryKey: ADMIN_DRIVERS_KEY, queryFn: fetchAllDriversAdmin, enabled: isAdmin });
  const reviewsQuery = useQuery({ queryKey: ADMIN_REVIEWS_KEY, queryFn: fetchAllReviewsAdmin, enabled: isAdmin });
  const couponsQuery = useQuery({ queryKey: ADMIN_COUPONS_KEY, queryFn: fetchPlatformCoupons, enabled: isAdmin });
  useOrdersRealtime(ADMIN_ORDERS_KEY);

  const restaurants = restaurantsQuery.data || [];
  const orders = ordersQuery.data || [];
  const drivers = driversQuery.data || [];
  const reviews = reviewsQuery.data || [];
  const platformCoupons = couponsQuery.data || [];
  const customerIds = useMemo(() => [...new Set(orders.map((o) => o.customer_id).filter(Boolean))], [orders]);
  const customersQuery = useQuery({
    queryKey: ["admin", "customers", customerIds],
    queryFn: () => fetchProfilesByIds(customerIds),
    enabled: isAdmin && customerIds.length > 0,
  });
  const customerProfiles = customersQuery.data || [];
  const loadingData = restaurantsQuery.isLoading || ordersQuery.isLoading || driversQuery.isLoading;

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
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [financePeriod, setFinancePeriod] = useState("30");
  const [workingOrderId, setWorkingOrderId] = useState(null);
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [workingReviewId, setWorkingReviewId] = useState(null);
  const [workingPhotoKey, setWorkingPhotoKey] = useState(null);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [workingCouponId, setWorkingCouponId] = useState(null);

  async function handleAdvanceOrder(order, nextStatus) {
    setWorkingOrderId(order.id);
    try {
      await updateOrderStatus(order.id, nextStatus);
      queryClient.setQueryData(ADMIN_ORDERS_KEY, (prev) => (prev || []).map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o)));
      showToast(`Pedido #${order.id.slice(0, 8)} atualizado para "${STATUS_META[nextStatus].label}"`);
    } catch {
      showToast("Não foi possível atualizar o pedido agora.");
    } finally {
      setWorkingOrderId(null);
    }
  }

  async function handleCancelOrder(order) {
    if (!window.confirm(`Cancelar o pedido #${order.id.slice(0, 8)} de ${order.restaurants?.name}? Essa ação não pode ser desfeita.`)) return;
    setWorkingOrderId(order.id);
    try {
      await updateOrderStatus(order.id, "cancelled");
      queryClient.setQueryData(ADMIN_ORDERS_KEY, (prev) => (prev || []).map((o) => (o.id === order.id ? { ...o, status: "cancelled" } : o)));
      showToast(`Pedido #${order.id.slice(0, 8)} cancelado.`);
    } catch {
      showToast("Não foi possível cancelar o pedido agora.");
    } finally {
      setWorkingOrderId(null);
    }
  }

  const [workingRestaurantId, setWorkingRestaurantId] = useState(null);

  async function handleSuspendRestaurant(restaurant) {
    const reason = window.prompt(`Por que suspender "${restaurant.name}"? (motivo fica registrado, opcional)`, "");
    if (reason === null) return; // cancelou o prompt
    setWorkingRestaurantId(restaurant.id);
    try {
      await updateRestaurant(restaurant.id, { suspended: true, suspension_reason: reason || null });
      queryClient.setQueryData(ADMIN_RESTAURANTS_KEY, (prev) =>
        (prev || []).map((r) => (r.id === restaurant.id ? { ...r, suspended: true, suspension_reason: reason || null } : r)));
      showToast(`${restaurant.name} suspenso — sai da vitrine pros clientes.`);
    } catch {
      showToast("Não foi possível suspender agora.");
    } finally {
      setWorkingRestaurantId(null);
    }
  }

  async function handleReactivateRestaurant(restaurant) {
    if (!window.confirm(`Reativar "${restaurant.name}"? Ele volta a aparecer pros clientes.`)) return;
    setWorkingRestaurantId(restaurant.id);
    try {
      await updateRestaurant(restaurant.id, { suspended: false, suspension_reason: null });
      queryClient.setQueryData(ADMIN_RESTAURANTS_KEY, (prev) =>
        (prev || []).map((r) => (r.id === restaurant.id ? { ...r, suspended: false, suspension_reason: null } : r)));
      showToast(`${restaurant.name} reativado.`);
    } catch {
      showToast("Não foi possível reativar agora.");
    } finally {
      setWorkingRestaurantId(null);
    }
  }

  async function handleRemoveBannerPhoto(restaurant) {
    if (!window.confirm(`Remover a foto de capa de "${restaurant.name}"?`)) return;
    setWorkingPhotoKey("banner");
    try {
      await updateRestaurant(restaurant.id, { banner_url: null });
      queryClient.setQueryData(ADMIN_RESTAURANTS_KEY, (prev) =>
        (prev || []).map((r) => (r.id === restaurant.id ? { ...r, banner_url: null } : r)));
      showToast("Foto de capa removida.");
    } catch {
      showToast("Não foi possível remover a foto agora.");
    } finally {
      setWorkingPhotoKey(null);
    }
  }

  async function handleRemoveMenuItemPhoto(item) {
    if (!window.confirm(`Remover a foto de "${item.name}"?`)) return;
    setWorkingPhotoKey(item.id);
    try {
      await updateMenuItem(item.id, { image_url: null });
      queryClient.setQueryData(ADMIN_RESTAURANTS_KEY, (prev) =>
        (prev || []).map((r) => (r.id === item.restaurant_id
          ? { ...r, menu_items: (r.menu_items || []).map((mi) => (mi.id === item.id ? { ...mi, image_url: null } : mi)) }
          : r)));
      showToast("Foto do prato removida.");
    } catch {
      showToast("Não foi possível remover a foto agora.");
    } finally {
      setWorkingPhotoKey(null);
    }
  }

  async function handleHideReview(review) {
    const reason = window.prompt("Por que ocultar essa avaliação? (motivo fica registrado, opcional)", "");
    if (reason === null) return;
    setWorkingReviewId(review.id);
    try {
      await updateReview(review.id, { hidden: true, hidden_reason: reason || null });
      queryClient.setQueryData(ADMIN_REVIEWS_KEY, (prev) =>
        (prev || []).map((r) => (r.id === review.id ? { ...r, hidden: true, hidden_reason: reason || null } : r)));
      showToast("Avaliação ocultada — não aparece mais pros clientes.");
    } catch {
      showToast("Não foi possível ocultar agora.");
    } finally {
      setWorkingReviewId(null);
    }
  }

  async function handleUnhideReview(review) {
    setWorkingReviewId(review.id);
    try {
      await updateReview(review.id, { hidden: false, hidden_reason: null });
      queryClient.setQueryData(ADMIN_REVIEWS_KEY, (prev) =>
        (prev || []).map((r) => (r.id === review.id ? { ...r, hidden: false, hidden_reason: null } : r)));
      showToast("Avaliação reexibida.");
    } catch {
      showToast("Não foi possível reexibir agora.");
    } finally {
      setWorkingReviewId(null);
    }
  }

  async function handleTogglePlatformCoupon(coupon) {
    setWorkingCouponId(coupon.id);
    try {
      await updateCoupon(coupon.id, { active: !coupon.active });
      queryClient.setQueryData(ADMIN_COUPONS_KEY, (prev) =>
        (prev || []).map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c)));
    } catch {
      showToast("Não foi possível atualizar o cupom agora.");
    } finally {
      setWorkingCouponId(null);
    }
  }

  const [workingCustomerId, setWorkingCustomerId] = useState(null);

  async function handleBlockCustomer(profile) {
    const reason = window.prompt(`Por que bloquear ${profile.full_name || profile.email || "esse cliente"}? (motivo fica registrado, opcional)`, "");
    if (reason === null) return;
    setWorkingCustomerId(profile.id);
    try {
      await updateProfile(profile.id, { blocked: true, blocked_reason: reason || null });
      queryClient.setQueryData(["admin", "customers", customerIds], (prev) =>
        (prev || []).map((p) => (p.id === profile.id ? { ...p, blocked: true, blocked_reason: reason || null } : p)));
      showToast(`${profile.full_name || "Cliente"} bloqueado — não vai conseguir fazer novo pedido.`);
    } catch {
      showToast("Não foi possível bloquear agora.");
    } finally {
      setWorkingCustomerId(null);
    }
  }

  async function handleUnblockCustomer(profile) {
    if (!window.confirm(`Desbloquear ${profile.full_name || profile.email || "esse cliente"}?`)) return;
    setWorkingCustomerId(profile.id);
    try {
      await updateProfile(profile.id, { blocked: false, blocked_reason: null });
      queryClient.setQueryData(["admin", "customers", customerIds], (prev) =>
        (prev || []).map((p) => (p.id === profile.id ? { ...p, blocked: false, blocked_reason: null } : p)));
      showToast(`${profile.full_name || "Cliente"} desbloqueado.`);
    } catch {
      showToast("Não foi possível desbloquear agora.");
    } finally {
      setWorkingCustomerId(null);
    }
  }

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
  const STUCK_HOURS = 2;
  const stuckOrders = orders.filter((o) => OPEN_STATUSES.includes(o.status) && Date.now() - new Date(o.created_at).getTime() > STUCK_HOURS * 3600000);

  function goToRestaurants(filter) {
    setSelectedRestaurantId(null);
    setRestaurantFilter(filter);
    setActiveSection("restaurantes");
  }

  function goToOrders() {
    setOrderStatusFilter("all");
    setOrderSearch("");
    setActiveSection("pedidos");
  }

  const filteredHealth = health.filter((h) => {
    const q = restaurantSearch.trim().toLowerCase();
    if (q && !h.restaurant.name.toLowerCase().includes(q) && !(h.restaurant.category || "").toLowerCase().includes(q)) return false;
    if (restaurantFilter === "no_mp" && h.restaurant.mp_connected) return false;
    if (restaurantFilter === "no_orders" && h.orderCount > 0) return false;
    if (restaurantFilter === "closed" && h.restaurant.is_open !== false) return false;
    if (restaurantFilter === "suspended" && !h.restaurant.suspended) return false;
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

  const customerHealth = buildCustomerHealth(customerProfiles, orders);
  const cq = customerSearch.trim().toLowerCase();
  const filteredCustomers = customerHealth.filter((c) => {
    if (cq && !(c.profile.full_name || "").toLowerCase().includes(cq) && !(c.profile.email || "").toLowerCase().includes(cq)) return false;
    if (customerFilter === "blocked" && !c.profile.blocked) return false;
    return true;
  }).sort((a, b) => b.spend - a.spend);

  const rq = reviewSearch.trim().toLowerCase();
  const filteredReviews = reviews.filter((r) => {
    if (reviewFilter === "hidden" && !r.hidden) return false;
    if (reviewFilter === "low" && r.rating > 2) return false;
    if (!rq) return true;
    return (r.restaurants?.name || "").toLowerCase().includes(rq) ||
      (r.customer_name || "").toLowerCase().includes(rq) ||
      (r.comment || "").toLowerCase().includes(rq);
  });

  const financeOrders = filterByPeriod(orders, financePeriod);
  const confirmedOrders = financeOrders.filter(isConfirmedOrder);
  const gmvConfirmed = confirmedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const commissionConfirmed = confirmedOrders.reduce((sum, o) => sum + Number(o.commission_amount || 0), 0);
  const payoutConfirmed = confirmedOrders.reduce((sum, o) => sum + Number(o.restaurant_payout ?? (o.total - (o.commission_amount || 0))), 0);
  const discountConfirmed = confirmedOrders.reduce((sum, o) => sum + Number(o.discount_amount || 0), 0);
  const paymentIssues = financeOrders
    .filter((o) => ONLINE_PAYMENT_METHODS.includes(o.payment_method) && o.payment_status !== "approved" && o.status !== "cancelled")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const restaurantFinance = buildRestaurantFinance(restaurants, financeOrders)
    .filter((f) => f.orderCount > 0)
    .sort((a, b) => b.commission - a.commission);

  function exportFinanceCsv() {
    downloadCsv(`vem-provar-financeiro-${financePeriod}d-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Pedido", "Restaurante", "Data", "Total", "Comissão", "Repasse", "Desconto", "Método", "Status pagamento", "Status pedido"],
      financeOrders.map((o) => [
        o.id.slice(0, 8), o.restaurants?.name || "", new Date(o.created_at).toLocaleString("pt-BR"),
        Number(o.total || 0).toFixed(2), Number(o.commission_amount || 0).toFixed(2),
        Number(o.restaurant_payout ?? (o.total - (o.commission_amount || 0))).toFixed(2),
        Number(o.discount_amount || 0).toFixed(2), o.payment_method || "",
        paymentStatusMeta(o.payment_status).label, STATUS_META[o.status]?.label || o.status,
      ]));
  }

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

                {(noMpCount > 0 || noOrdersCount > 0 || closedCount > 0 || stuckOrders.length > 0) && (
                  <div style={{ marginBottom: 28 }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                      <AlertTriangle size={16} color={C.orange} />
                      <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Precisa de atenção</h2>
                    </div>
                    <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                      {stuckOrders.length > 0 && (
                        <button onClick={goToOrders} className="flex items-center gap-2"
                          style={{ background: "rgba(238,108,26,.08)", border: `1px solid ${C.orange}`, borderRadius: RADIUS.md,
                                   padding: "10px 14px", cursor: "pointer", fontFamily: FONT }}>
                          <Clock3 size={14} color={C.orange} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.black }}>
                            {stuckOrders.length} pedido{stuckOrders.length > 1 ? "s" : ""} parado{stuckOrders.length > 1 ? "s" : ""} há mais de {STUCK_HOURS}h
                          </span>
                        </button>
                      )}
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
                <RestaurantDetail health={selectedHealth} orders={orders} onBack={() => setSelectedRestaurantId(null)}
                  onAdvance={handleAdvanceOrder} onCancel={handleCancelOrder} workingOrderId={workingOrderId}
                  onSuspend={handleSuspendRestaurant} onReactivate={handleReactivateRestaurant} workingRestaurantId={workingRestaurantId}
                  onRemoveBanner={handleRemoveBannerPhoto} onRemoveMenuItemPhoto={handleRemoveMenuItemPhoto} workingPhotoKey={workingPhotoKey} />
              ) : (
                <>
                  <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Restaurantes</h1>
                  <div className="flex items-center gap-2" style={{ marginBottom: 16, flexWrap: "wrap" }}>
                    <SearchBox value={restaurantSearch} onChange={setRestaurantSearch} placeholder="Buscar restaurante ou categoria" />
                    <FilterChip active={restaurantFilter === "all"} onClick={() => setRestaurantFilter("all")}>Todos</FilterChip>
                    <FilterChip active={restaurantFilter === "no_mp"} onClick={() => setRestaurantFilter("no_mp")} color={C.orange}>Sem MP</FilterChip>
                    <FilterChip active={restaurantFilter === "no_orders"} onClick={() => setRestaurantFilter("no_orders")}>Sem pedidos</FilterChip>
                    <FilterChip active={restaurantFilter === "closed"} onClick={() => setRestaurantFilter("closed")}>Fechados</FilterChip>
                    <FilterChip active={restaurantFilter === "suspended"} onClick={() => setRestaurantFilter("suspended")} color="#B42318">Suspensos</FilterChip>
                  </div>

                  {filteredHealth.length === 0 ? (
                    <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum restaurante encontrado.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {filteredHealth.map((h) => {
                        const r = h.restaurant;
                        return (
                          <button key={r.id} onClick={() => setSelectedRestaurantId(r.id)} className="flex items-center vp-tap"
                            style={{ gap: 12, padding: 12, background: "#fff", border: `1px solid ${r.suspended ? "#B42318" : C.line}`, borderRadius: RADIUS.lg,
                                     cursor: "pointer", textAlign: "left", width: "100%", fontFamily: FONT }}>
                            <RestaurantAvatar iconKey={r.icon_key} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                                <span style={{ fontSize: 14.5, fontWeight: 600 }}>{r.name}</span>
                                {r.suspended && (
                                  <span className="flex items-center gap-1" style={{ fontSize: 10.5, fontWeight: 700,
                                       color: "#B42318", background: "#FDECEC", padding: "2px 7px", borderRadius: RADIUS.pill }}>
                                    <ShieldOff size={10} /> Suspenso
                                  </span>
                                )}
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
                    {filteredOrders.map((o) => (
                      <OrderRow key={o.id} order={o} onAdvance={handleAdvanceOrder} onCancel={handleCancelOrder}
                        working={workingOrderId === o.id} />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeSection === "financeiro" && (
              <>
                <div className="flex items-center justify-between" style={{ marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Financeiro</h1>
                  <button onClick={exportFinanceCsv} className="flex items-center gap-2"
                    style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.sm, cursor: "pointer",
                             padding: "9px 14px", fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.black }}>
                    <Download size={14} /> Exportar CSV
                  </button>
                </div>

                <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
                  {FINANCE_PERIODS.map((p) => (
                    <FilterChip key={p.key} active={financePeriod === p.key} onClick={() => setFinancePeriod(p.key)}>
                      {p.label}
                    </FilterChip>
                  ))}
                </div>

                <div className="vp-dash-stats" style={{ marginBottom: 24 }}>
                  <StatTile icon={TrendingUp} label="GMV confirmado" value={formatBRL(gmvConfirmed)} />
                  <StatTile icon={Wallet} label="Receita da plataforma" value={formatBRL(commissionConfirmed)} accent />
                  <StatTile icon={Store} label="Repasse aos restaurantes" value={formatBRL(payoutConfirmed)} />
                  <StatTile icon={TicketPercent} label="Descontos em cupons" value={formatBRL(discountConfirmed)} />
                </div>

                {paymentIssues.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                      <AlertTriangle size={16} color={C.orange} />
                      <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                        Pagamentos pendentes ou com problema ({paymentIssues.length})
                      </h2>
                    </div>
                    <p style={{ fontSize: 12.5, color: C.grayText, margin: "0 0 12px" }}>
                      Pedidos pagos por Pix ou cartão online que ainda não foram confirmados como pagos pelo Mercado Pago.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {paymentIssues.map((o) => <PaymentIssueRow key={o.id} order={o} />)}
                    </div>
                  </div>
                )}

                <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Por restaurante</h2>
                {restaurantFinance.length === 0 ? (
                  <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum pedido confirmado nesse período.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {restaurantFinance.map((f) => (
                      <div key={f.restaurant.id} className="flex items-center justify-between"
                        style={{ padding: "12px 14px", background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.md, gap: 10, flexWrap: "wrap" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{f.restaurant.name}</div>
                          <div style={{ fontSize: 12, color: C.grayText }}>{f.orderCount} pedido{f.orderCount === 1 ? "" : "s"} confirmado{f.orderCount === 1 ? "" : "s"}</div>
                        </div>
                        <div className="flex items-center gap-4" style={{ flexShrink: 0 }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: C.grayText }}>GMV</div>
                            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{formatBRL(f.gmv)}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: C.grayText }}>Comissão</div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.orange }}>{formatBRL(f.commission)}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: C.grayText }}>Repasse</div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ok }}>{formatBRL(f.payout)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeSection === "clientes" && (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Clientes</h1>
                <p style={{ fontSize: 12.5, color: C.grayText, margin: "-12px 0 16px" }}>
                  Só aparece quem já fez pelo menos um pedido.
                </p>
                <div className="flex items-center gap-2" style={{ marginBottom: 16, flexWrap: "wrap" }}>
                  <SearchBox value={customerSearch} onChange={setCustomerSearch} placeholder="Buscar por nome ou e-mail" />
                  <FilterChip active={customerFilter === "all"} onClick={() => setCustomerFilter("all")}>Todos</FilterChip>
                  <FilterChip active={customerFilter === "blocked"} onClick={() => setCustomerFilter("blocked")} color="#B42318">Bloqueados</FilterChip>
                </div>

                {filteredCustomers.length === 0 ? (
                  <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum cliente encontrado.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filteredCustomers.map((c) => {
                      const p = c.profile;
                      const busy = workingCustomerId === p.id;
                      return (
                        <div key={p.id} className="flex items-center justify-between" style={{ padding: "12px 14px",
                             background: "#fff", border: `1px solid ${p.blocked ? "#B42318" : C.line}`, borderRadius: RADIUS.lg, gap: 10, flexWrap: "wrap" }}>
                          <div style={{ minWidth: 0 }}>
                            <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                              <span style={{ fontSize: 14.5, fontWeight: 600 }}>{p.full_name || "Sem nome"}</span>
                              {p.blocked && (
                                <span className="flex items-center gap-1" style={{ fontSize: 10.5, fontWeight: 700,
                                     color: "#B42318", background: "#FDECEC", padding: "2px 7px", borderRadius: RADIUS.pill }}>
                                  <Ban size={10} /> Bloqueado
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: C.grayText, marginTop: 2 }}>
                              {p.email || "—"} · Último pedido: {relativeTime(c.lastOrderAt)}
                              {c.cancelledCount > 0 && ` · ${c.cancelledCount} cancelado${c.cancelledCount === 1 ? "" : "s"}`}
                            </div>
                            {p.blocked && p.blocked_reason && (
                              <div style={{ fontSize: 12, color: "#B42318", marginTop: 2 }}>Motivo: {p.blocked_reason}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 14, fontWeight: 700 }}>{formatBRL(c.spend)}</div>
                              <div style={{ fontSize: 12, color: C.grayText }}>{c.orderCount} pedido{c.orderCount === 1 ? "" : "s"}</div>
                            </div>
                            {p.blocked ? (
                              <button disabled={busy} onClick={() => handleUnblockCustomer(p)}
                                style={{ background: C.ok, color: "#fff", border: "none", borderRadius: RADIUS.xs, cursor: busy ? "default" : "pointer",
                                         padding: "7px 12px", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, opacity: busy ? .6 : 1 }}>
                                Desbloquear
                              </button>
                            ) : (
                              <button disabled={busy} onClick={() => handleBlockCustomer(p)}
                                style={{ background: "#fff", color: "#B42318", border: "1px solid #B42318", borderRadius: RADIUS.xs, cursor: busy ? "default" : "pointer",
                                         padding: "7px 12px", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, opacity: busy ? .6 : 1 }}>
                                Bloquear
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
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

            {activeSection === "avaliacoes" && (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Avaliações</h1>
                <div className="flex items-center gap-2" style={{ marginBottom: 16, flexWrap: "wrap" }}>
                  <SearchBox value={reviewSearch} onChange={setReviewSearch} placeholder="Buscar por restaurante, cliente ou comentário" />
                  <FilterChip active={reviewFilter === "all"} onClick={() => setReviewFilter("all")}>Todas</FilterChip>
                  <FilterChip active={reviewFilter === "low"} onClick={() => setReviewFilter("low")} color={C.orange}>Nota baixa (≤2)</FilterChip>
                  <FilterChip active={reviewFilter === "hidden"} onClick={() => setReviewFilter("hidden")} color="#B42318">Ocultas</FilterChip>
                </div>

                {filteredReviews.length === 0 ? (
                  <p style={{ color: C.grayText, fontSize: 14 }}>Nenhuma avaliação encontrada.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filteredReviews.map((r) => {
                      const busy = workingReviewId === r.id;
                      return (
                        <div key={r.id} style={{ padding: "12px 14px", background: "#fff",
                             border: `1px solid ${r.hidden ? "#B42318" : C.line}`, borderRadius: RADIUS.lg }}>
                          <div className="flex items-center justify-between" style={{ gap: 10, flexWrap: "wrap" }}>
                            <div style={{ minWidth: 0 }}>
                              <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                                <span style={{ fontSize: 14, fontWeight: 700 }}>{r.restaurants?.name || "—"}</span>
                                <span style={{ fontSize: 12.5, color: C.grayText }}>{r.customer_name || "Cliente"}</span>
                                {r.hidden && (
                                  <span className="flex items-center gap-1" style={{ fontSize: 10.5, fontWeight: 700,
                                       color: "#B42318", background: "#FDECEC", padding: "2px 7px", borderRadius: RADIUS.pill }}>
                                    <EyeOff size={10} /> Oculta
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1" style={{ margin: "4px 0" }}>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <Star key={n} size={12} fill={n <= r.rating ? C.orange : "none"} color={C.orange} />
                                ))}
                                <span style={{ fontSize: 11.5, color: C.grayText, marginLeft: 6 }}>
                                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                              {r.comment && <p style={{ fontSize: 13, color: C.black, margin: "4px 0 0" }}>{r.comment}</p>}
                              {r.hidden && r.hidden_reason && (
                                <div style={{ fontSize: 12, color: "#B42318", marginTop: 4 }}>Motivo: {r.hidden_reason}</div>
                              )}
                            </div>
                            {r.hidden ? (
                              <button disabled={busy} onClick={() => handleUnhideReview(r)} className="flex items-center gap-1"
                                style={{ background: C.ok, color: "#fff", border: "none", borderRadius: RADIUS.xs, cursor: busy ? "default" : "pointer",
                                         padding: "7px 12px", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, opacity: busy ? .6 : 1, flexShrink: 0 }}>
                                <Eye size={13} /> Reexibir
                              </button>
                            ) : (
                              <button disabled={busy} onClick={() => handleHideReview(r)} className="flex items-center gap-1"
                                style={{ background: "#fff", color: "#B42318", border: "1px solid #B42318", borderRadius: RADIUS.xs, cursor: busy ? "default" : "pointer",
                                         padding: "7px 12px", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, opacity: busy ? .6 : 1, flexShrink: 0 }}>
                                <EyeOff size={13} /> Ocultar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeSection === "cupons" && (
              <>
                <div className="flex items-center justify-between" style={{ marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Cupons da plataforma</h1>
                    <p style={{ fontSize: 12.5, color: C.grayText, margin: "4px 0 0" }}>
                      Valem em qualquer restaurante — diferente dos cupons que cada loja cria no próprio painel.
                    </p>
                  </div>
                  {!showCouponForm && (
                    <button onClick={() => setShowCouponForm(true)} className="flex items-center gap-1"
                      style={{ background: C.orange, color: "#fff", border: "none", cursor: "pointer", borderRadius: RADIUS.sm,
                               padding: "9px 14px", fontFamily: FONT, fontSize: 13.5, fontWeight: 600, flexShrink: 0 }}>
                      <Plus size={15} /> Criar cupom
                    </button>
                  )}
                </div>

                {showCouponForm && (
                  <CouponForm restaurantId={null}
                    onSaved={() => { setShowCouponForm(false); queryClient.invalidateQueries({ queryKey: ADMIN_COUPONS_KEY }); }}
                    onCancel={() => setShowCouponForm(false)} />
                )}

                {platformCoupons.length === 0 ? (
                  <p style={{ color: C.grayText, fontSize: 14 }} className="flex items-center gap-2">
                    <TicketPercent size={16} /> Nenhum cupom de plataforma criado ainda.
                  </p>
                ) : (
                  <div className="vp-card-grid">
                    {platformCoupons.map((c) => {
                      const busy = workingCouponId === c.id;
                      return (
                        <div key={c.id} className="flex items-center gap-3" style={{ background: "#fff",
                             border: `1px solid ${C.line}`, borderRadius: RADIUS.md, padding: "12px 14px" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: 14.5, fontWeight: 700 }}>{c.code}</span>
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: c.active ? C.ok : C.grayText,
                                   background: c.active ? "rgba(46,158,91,.1)" : C.surface, padding: "2px 8px", borderRadius: RADIUS.pill }}>
                                {c.active ? "Ativo" : "Pausado"}
                              </span>
                            </div>
                            <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 3 }}>
                              {c.discount_type === "percent" ? `${Number(c.discount_value)}% de desconto` : `${formatBRL(c.discount_value)} de desconto`}
                              {Number(c.min_order_value) > 0 && ` · pedido mín. ${formatBRL(c.min_order_value)}`}
                              {c.max_uses != null && ` · ${c.uses_count}/${c.max_uses} usos`}
                              {c.max_uses == null && ` · ${c.uses_count} usos`}
                              {c.expires_at && ` · expira em ${new Date(c.expires_at).toLocaleDateString("pt-BR")}`}
                            </div>
                          </div>
                          <button disabled={busy} onClick={() => handleTogglePlatformCoupon(c)}
                            style={{ background: "none", border: `1px solid ${C.line}`, cursor: busy ? "default" : "pointer", borderRadius: RADIUS.xs,
                                     padding: "6px 12px", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: C.grayText, flexShrink: 0, opacity: busy ? .6 : 1 }}>
                            {c.active ? "Pausar" : "Reativar"}
                          </button>
                        </div>
                      );
                    })}
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
