import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import {
  Plus, Trash2, Pencil, Store, Package, Wallet, CreditCard, CheckCircle2, Receipt, TrendingUp, Clock3,
} from "lucide-react";
import { C, FONT, formatBRL } from "../../theme";
import { ICONS } from "../../data/icons";
import { useAuth } from "../../context/AuthContext";
import {
  fetchRestaurantByOwner, createMenuItem, updateMenuItem, deleteMenuItem, fetchOrdersForRestaurant, updateOrderStatus,
} from "../../data/queries";
import { getCommissionRate, isInPromoPeriod, promoEndsAt } from "../../lib/commission";
import { STATUS_META, STATUS_OPTIONS, OPEN_STATUSES } from "../../lib/orderStatus";
import PortalHeader from "../../components/PortalHeader";
import { SkeletonPage } from "../../components/Skeleton";

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

export default function PartnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const mpStatus = searchParams.get("mp");

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

  if (authLoading) {
    return (
      <SkeletonPage />
    );
  }

  if (!user) return <Navigate to="/parceiro/entrar" replace />;

  if (loading) {
    return (
      <SkeletonPage />
    );
  }

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

  const todayKey = new Date().toDateString();
  const todaysOrders = orders.filter((o) => new Date(o.created_at).toDateString() === todayKey);
  const todayRevenue = todaysOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const openOrdersCount = orders.filter((o) => OPEN_STATUSES.includes(o.status)).length;
  const totalPayout = orders.reduce((sum, o) => sum + Number(o.restaurant_payout ?? o.total), 0);

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <PortalHeader label="Portal do Parceiro" />
      <section className="vp-wrap" style={{ padding: "32px 24px 120px", maxWidth: 1080 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: C.orange, display: "grid", placeItems: "center" }}>
            <Icon size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{restaurant.name}</h1>
            <div style={{ fontSize: 13.5, color: C.grayText }}>{restaurant.category}</div>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: C.grayText, marginBottom: 20 }}>{restaurant.address}</p>

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

        <div className="vp-dash-stats" style={{ marginBottom: 28 }}>
          <StatTile icon={Receipt} label="Pedidos hoje" value={todaysOrders.length} />
          <StatTile icon={TrendingUp} label="Faturamento hoje" value={formatBRL(todayRevenue)} />
          <StatTile icon={Clock3} label="Em aberto" value={openOrdersCount} accent={openOrdersCount > 0} />
          <StatTile icon={Wallet} label="Você recebeu" value={formatBRL(totalPayout)} />
        </div>

        <div className="vp-dash-grid">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Pedidos recebidos</h2>
            {orders.length === 0 ? (
              <p style={{ color: C.grayText, fontSize: 14 }} className="flex items-center gap-2">
                <Package size={16} /> Nenhum pedido ainda.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {orders.map((order) => {
                  const meta = STATUS_META[order.status] || STATUS_META.pending;
                  return (
                    <div key={order.id} style={{ padding: 14, background: "#fff", border: `1px solid ${C.line}`,
                         borderLeft: `4px solid ${meta.color}`, borderRadius: 14 }}>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 14, fontWeight: 700 }}>Pedido #{order.id.slice(0, 8)}</span>
                        <span style={{ fontSize: 13, color: C.grayText }}>
                          {new Date(order.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div style={{ fontSize: 13.5, color: C.grayText, marginTop: 4 }}>{order.address}</div>
                      <div style={{ marginTop: 8 }}>
                        {(order.order_items || []).map((i) => (
                          <div key={i.id} style={{ fontSize: 13.5, marginBottom: 2 }}>
                            {i.qty}x {i.name}
                            {i.notes && <span style={{ color: C.orange, fontStyle: "italic" }}> — Obs: {i.notes}</span>}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between" style={{ marginTop: 10, flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{formatBRL(order.total)}</span>
                          {order.restaurant_payout != null && (
                            <div style={{ fontSize: 12, color: C.ok, marginTop: 2 }}>
                              Você recebe {formatBRL(order.restaurant_payout)}
                              {Number(order.commission_amount) === 0 ? " · sem comissão" : ` · comissão ${formatBRL(order.commission_amount)}`}
                            </div>
                          )}
                        </div>
                        <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          style={{ border: `1.5px solid ${meta.color}`, outline: "none", borderRadius: 8, padding: "6px 10px",
                                   fontFamily: FONT, fontSize: 13, fontWeight: 700, background: meta.bg, color: meta.color, cursor: "pointer" }}>
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="vp-dash-side">
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Financeiro</h2>
              <MercadoPagoCard restaurant={restaurant} />
              <CommissionCard restaurant={restaurant} orders={orders} />
            </div>

            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Cardápio</h2>
                {!showAddForm && (
                  <button onClick={() => setShowAddForm(true)} className="flex items-center gap-1"
                    style={{ background: C.orange, color: "#fff", border: "none", cursor: "pointer", borderRadius: 10,
                             padding: "9px 16px", fontFamily: FONT, fontSize: 13.5, fontWeight: 600 }}>
                    <Plus size={15} /> Adicionar
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
                    <div key={item.id} className="flex items-center" style={{ gap: 10, padding: 12, background: "#fff",
                         border: `1px solid ${C.line}`, borderRadius: 14 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 12.5, color: C.grayText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.description}
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 4 }}>{formatBRL(item.price)}</div>
                      </div>
                      <button onClick={() => setEditingItem(item.id)}
                        style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff",
                                 cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff",
                                 cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <Trash2 size={14} color="#B42318" />
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
