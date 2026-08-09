import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Trash2, Pencil, Store, Package } from "lucide-react";
import { C, FONT, formatBRL } from "../../theme";
import { ICONS } from "../../data/icons";
import { useAuth } from "../../context/AuthContext";
import {
  fetchRestaurantByOwner, createMenuItem, updateMenuItem, deleteMenuItem, fetchOrdersForRestaurant, updateOrderStatus,
} from "../../data/queries";
import PortalHeader from "../../components/PortalHeader";

const STATUS_OPTIONS = [
  { value: "pending", label: "Recebido" },
  { value: "preparing", label: "Em preparo" },
  { value: "out_for_delivery", label: "Saiu para entrega" },
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" },
];

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

export default function PartnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

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
      <div style={{ fontFamily: FONT, minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <p style={{ color: C.grayText }}>Carregando…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/parceiro/entrar" replace />;

  if (loading) {
    return (
      <div style={{ fontFamily: FONT, minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <p style={{ color: C.grayText }}>Carregando…</p>
      </div>
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

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <PortalHeader label="Portal do Parceiro" />
      <section className="vp-wrap" style={{ padding: "32px 24px 120px", maxWidth: 720 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: C.orange, display: "grid", placeItems: "center" }}>
            <Icon size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{restaurant.name}</h1>
            <div style={{ fontSize: 13.5, color: C.grayText }}>{restaurant.category}</div>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: C.grayText, marginBottom: 32 }}>{restaurant.address}</p>

        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
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

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
          {(restaurant.menu_items || []).length === 0 && !showAddForm && (
            <p style={{ color: C.grayText, fontSize: 14 }}>Nenhum item cadastrado ainda.</p>
          )}
          {(restaurant.menu_items || []).map((item) =>
            editingItem === item.id ? (
              <MenuItemForm key={item.id} restaurantId={restaurant.id} item={item}
                onSaved={() => { setEditingItem(null); reload(); }}
                onCancel={() => setEditingItem(null)} />
            ) : (
              <div key={item.id} className="flex items-center" style={{ gap: 12, padding: 14, background: "#fff",
                   border: `1px solid ${C.line}`, borderRadius: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 13, color: C.grayText }}>{item.description}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{formatBRL(item.price)}</div>
                </div>
                <button onClick={() => setEditingItem(item.id)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff",
                           cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(item.id)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff",
                           cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <Trash2 size={15} color="#B42318" />
                </button>
              </div>
            )
          )}
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Pedidos recebidos</h2>
        {orders.length === 0 ? (
          <p style={{ color: C.grayText, fontSize: 14 }} className="flex items-center gap-2">
            <Package size={16} /> Nenhum pedido ainda.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {orders.map((order) => (
              <div key={order.id} style={{ padding: 14, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14 }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 14, fontWeight: 700 }}>Pedido #{order.id.slice(0, 8)}</span>
                  <span style={{ fontSize: 13, color: C.grayText }}>
                    {new Date(order.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <div style={{ fontSize: 13.5, color: C.grayText, marginTop: 4 }}>{order.address}</div>
                <div style={{ fontSize: 13.5, marginTop: 6 }}>
                  {(order.order_items || []).map((i) => `${i.qty}x ${i.name}`).join(", ")}
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{formatBRL(order.total)}</span>
                  <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    style={{ border: `1.5px solid ${C.line}`, outline: "none", borderRadius: 8, padding: "6px 10px",
                             fontFamily: FONT, fontSize: 13, fontWeight: 600, background: "#fff", cursor: "pointer" }}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
