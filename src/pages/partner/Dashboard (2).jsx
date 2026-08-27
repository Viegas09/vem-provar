import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus, Trash2, Pencil, Store, Package, Wallet, CreditCard, CheckCircle2, XCircle, Receipt, TrendingUp,
  Clock3, Coins, Pause, Play, Home as HomeIcon, UtensilsCrossed, LogOut, ChevronLeft, ChevronRight,
  ImagePlus, BarChart3, ListPlus, ChevronDown, ChevronUp, TrendingDown, MessageCircle, X,
} from "lucide-react";
import { C, FONT, formatBRL } from "../../theme";
import { ICONS } from "../../data/icons";
import { useAuth } from "../../context/AuthContext";
import {
  fetchRestaurantByOwner, createMenuItem, updateMenuItem, deleteMenuItem, fetchOrdersForRestaurant,
  updateOrderStatus, updateRestaurant, uploadMenuItemPhoto, uploadRestaurantPhoto,
  createComplementGroup, deleteComplementGroup, createComplementItem, deleteComplementItem,
} from "../../data/queries";
import { getCommissionRate, isInPromoPeriod, promoEndsAt } from "../../lib/commission";
import { subscribeToPush } from "../../lib/push";
import { STATUS_META, STATUS_OPTIONS, OPEN_STATUSES } from "../../lib/orderStatus";
import { SkeletonPage } from "../../components/Skeleton";
import OrderChat from "../../components/OrderChat";
import NotificationBell from "../../components/NotificationBell";
import LocateButton from "../../components/LocateButton";
import WORDMARK_DARK from "../../assets/wordmark-dark.png";
import LOGO_MARK_HEART from "../../assets/logo-mark-heart.png";

const KANBAN_STATUSES = ["pending", "preparing", "out_for_delivery", "delivered", "cancelled"];
const NAV_ITEMS = [
  { key: "inicio", label: "Início", icon: HomeIcon },
  { key: "loja", label: "Loja", icon: Store },
  { key: "desempenho", label: "Desempenho", icon: BarChart3 },
  { key: "financeiro", label: "Financeiro", icon: Wallet },
  { key: "cardapio", label: "Cardápio", icon: UtensilsCrossed },
];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (key) => {
  const [y, m] = key.split("-");
  return `${MONTH_NAMES[Number(m) - 1]} de ${y}`;
};

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
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(item?.image_url || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let imageUrl = item?.image_url || null;
      if (photoFile) {
        imageUrl = await uploadMenuItemPhoto(restaurantId, photoFile);
      }
      if (item) {
        await updateMenuItem(item.id, { name, description, price: Number(price), image_url: imageUrl });
      } else {
        await createMenuItem({
          restaurant_id: restaurantId,
          name,
          description,
          price: Number(price),
          color_variant: Math.floor(Math.random() * 5),
          image_url: imageUrl,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.message || "Não foi possível salvar o item. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, background: C.surface,
         borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
        <div style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0, overflow: "hidden",
             border: `1.5px dashed ${C.line}`, background: "#fff", display: "grid", placeItems: "center" }}>
          {photoPreview ? (
            <img src={photoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <ImagePlus size={20} color={C.grayText} />
          )}
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{photoPreview ? "Trocar foto" : "Adicionar foto"}</div>
          <div style={{ fontSize: 12, color: C.grayText }}>Opcional, mas ajuda o cliente a decidir</div>
        </div>
      </label>
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
      {error && (
        <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>
          {error}
        </div>
      )}
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

const STORE_ICON_OPTIONS = [
  { key: "pizza", label: "Pizza" },
  { key: "sandwich", label: "Lanches" },
  { key: "fish", label: "Japonês / Peixes" },
  { key: "coffee", label: "Café / Padaria" },
  { key: "cake", label: "Doces" },
  { key: "soup", label: "Marmita" },
  { key: "salad", label: "Saudável" },
  { key: "cup", label: "Bebidas" },
  { key: "store", label: "Outro" },
];

const profileFieldStyle = {
  border: `1.5px solid ${C.line}`, outline: "none", borderRadius: 10, padding: "10px 12px",
  fontFamily: FONT, fontSize: 14.5, background: "#fff", width: "100%", boxSizing: "border-box",
};
const profileLabelStyle = { fontSize: 12.5, fontWeight: 700, color: C.grayText, display: "block", marginBottom: 6 };

function RestaurantProfileForm({ restaurant, onSaved }) {
  const [name, setName] = useState(restaurant.name || "");
  const [category, setCategory] = useState(restaurant.category || "");
  const [iconKey, setIconKey] = useState(restaurant.icon_key || "store");
  const [description, setDescription] = useState(restaurant.description || "");
  const [phone, setPhone] = useState(restaurant.phone || "");
  const [address, setAddress] = useState(restaurant.address || "");
  const [coords, setCoords] = useState(
    restaurant.latitude != null ? { latitude: restaurant.latitude, longitude: restaurant.longitude } : null
  );
  const [deliveryFee, setDeliveryFee] = useState(restaurant.delivery_fee ?? "");
  const [deliveryTime, setDeliveryTime] = useState(restaurant.delivery_time || "");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(restaurant.banner_url || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  function handleBannerChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  function handleLocated({ latitude, longitude, address: found }) {
    setCoords({ latitude, longitude });
    if (found) setAddress(found);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      let bannerUrl = restaurant.banner_url || null;
      if (bannerFile) {
        bannerUrl = await uploadRestaurantPhoto(restaurant.id, bannerFile);
      }
      await updateRestaurant(restaurant.id, {
        name,
        category,
        icon_key: iconKey,
        description,
        phone,
        address,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        delivery_fee: deliveryFee === "" ? 0 : Number(deliveryFee),
        delivery_time: deliveryTime || "30-50",
        banner_url: bannerUrl,
      });
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(err.message || "Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>
      <label style={{ cursor: "pointer" }}>
        <input type="file" accept="image/*" onChange={handleBannerChange} style={{ display: "none" }} />
        <div style={{ position: "relative", height: 140, borderRadius: 14, overflow: "hidden",
             border: `1.5px dashed ${C.line}`, background: C.surface, display: "grid", placeItems: "center" }}>
          {bannerPreview ? (
            <img src={bannerPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ textAlign: "center", color: C.grayText }}>
              <ImagePlus size={22} style={{ margin: "0 auto 6px" }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>Foto de capa</div>
            </div>
          )}
          <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,.6)", color: "#fff",
               fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 999 }}>
            {bannerPreview ? "Trocar foto" : "Adicionar foto"}
          </div>
        </div>
      </label>

      <div>
        <label style={profileLabelStyle}>Nome do restaurante</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} style={profileFieldStyle} />
      </div>

      <div>
        <label style={profileLabelStyle}>Categoria (aparece embaixo do nome, ex: Pizza · Italiana)</label>
        <input value={category} onChange={(e) => setCategory(e.target.value)} style={profileFieldStyle} />
      </div>

      <div>
        <label style={profileLabelStyle}>Tipo (usado na busca por categorias)</label>
        <select value={iconKey} onChange={(e) => setIconKey(e.target.value)} style={profileFieldStyle}>
          {STORE_ICON_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={profileLabelStyle}>Descrição</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          placeholder="Conte um pouco sobre o restaurante"
          style={{ ...profileFieldStyle, minHeight: 80, resize: "vertical" }} />
      </div>

      <div>
        <label style={profileLabelStyle}>Telefone / WhatsApp</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} style={profileFieldStyle} />
      </div>

      <div>
        <label style={profileLabelStyle}>Endereço</label>
        <input required value={address} onChange={(e) => setAddress(e.target.value)} style={profileFieldStyle} />
        <div style={{ marginTop: 8 }}>
          <LocateButton onLocated={handleLocated} />
        </div>
      </div>

      <div className="flex" style={{ gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={profileLabelStyle}>Taxa de entrega (R$)</label>
          <input type="number" min="0" step="0.01" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} style={profileFieldStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={profileLabelStyle}>Tempo estimado (ex: 30-40)</label>
          <input value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} style={profileFieldStyle} />
        </div>
      </div>

      {error && (
        <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: 10, padding: 12, fontSize: 13 }}>{error}</div>
      )}
      {saved && (
        <div style={{ background: "rgba(46,158,91,.1)", color: C.ok, borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600 }}>
          Dados salvos!
        </div>
      )}

      <button type="submit" disabled={saving}
        style={{ background: saving ? C.gray : C.orange, color: "#fff", border: "none", cursor: saving ? "default" : "pointer",
                 borderRadius: 12, padding: "13px 0", fontFamily: FONT, fontSize: 15, fontWeight: 600, alignSelf: "flex-start", minWidth: 200 }}>
        {saving ? "Salvando…" : "Salvar alterações"}
      </button>
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

function FinanceStat({ icon: Icon, label, value, tone }) {
  const color = tone === "up" ? C.ok : tone === "down" ? "#B42318" : C.black;
  return (
    <div style={{ flex: "1 1 170px", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 16 }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <Icon size={15} color={color} />
        <span style={{ fontSize: 12, color: C.grayText, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function RepasseDetail({ restaurant, orders }) {
  const currentKey = monthKey(new Date());
  const availableMonths = Array.from(new Set(orders.map((o) => monthKey(new Date(o.created_at)))));
  if (!availableMonths.includes(currentKey)) availableMonths.push(currentKey);
  availableMonths.sort().reverse();
  const [month, setMonth] = useState(availableMonths[0]);

  const filtered = orders.filter((o) => monthKey(new Date(o.created_at)) === month);
  const totalSales = filtered.reduce((sum, o) => sum + Number(o.total), 0);
  const totalCommission = filtered.reduce((sum, o) => sum + Number(o.commission_amount ?? 0), 0);
  const totalPayout = filtered.reduce((sum, o) => sum + Number(o.restaurant_payout ?? o.total), 0);
  const rate = getCommissionRate(restaurant);

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <select value={month} onChange={(e) => setMonth(e.target.value)}
          style={{ border: `1.5px solid ${C.line}`, outline: "none", borderRadius: 10, padding: "9px 14px",
                   fontFamily: FONT, fontSize: 13.5, fontWeight: 600, background: "#fff", cursor: "pointer" }}>
          {availableMonths.map((key) => (
            <option key={key} value={key}>{monthLabel(key)}</option>
          ))}
        </select>
      </div>

      <div className="flex" style={{ gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <FinanceStat icon={TrendingUp} label="Valor das vendas" value={formatBRL(totalSales)} tone="up" />
        <FinanceStat icon={TrendingDown} label={`Comissão (${rate}%)`} value={`- ${formatBRL(totalCommission)}`} tone="down" />
        <FinanceStat icon={Wallet} label="Valor líquido" value={formatBRL(totalPayout)} tone="neutral" />
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 22, marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: C.grayText, fontWeight: 600 }}>Valor líquido de {monthLabel(month).toLowerCase()}</div>
        <div style={{ fontSize: 32, fontWeight: 700, marginTop: 6 }}>{formatBRL(totalPayout)}</div>
        <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 10 }}>
          Repasse D+1 (Pix) / D+2 (cartão) direto na sua conta conectada · {filtered.length} pedido{filtered.length === 1 ? "" : "s"} no mês.
        </div>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Pedidos do mês</h3>
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

function RevenueBarChart({ orders }) {
  const [hover, setHover] = useState(null);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const data = days.map((d) => {
    const key = d.toDateString();
    const dayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === key);
    return { date: d, total: dayOrders.reduce((sum, o) => sum + Number(o.total), 0), count: dayOrders.length };
  });
  const max = Math.max(1, ...data.map((d) => d.total));
  const periodTotal = data.reduce((sum, d) => sum + d.total, 0);
  const chartH = 150;
  const barGap = 12;
  const barW = 30;
  const unitW = barW + barGap;
  const viewW = data.length * unitW;

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>Faturamento — últimos 7 dias</div>
      <div style={{ fontSize: 12, color: C.grayText, marginTop: 2, marginBottom: 18 }}>
        Total no período: {formatBRL(periodTotal)}
      </div>
      <div style={{ position: "relative" }}>
        {hover !== null && (
          <div style={{ position: "absolute", top: 0, left: `${((hover * unitW + unitW / 2) / viewW) * 100}%`,
               transform: "translate(-50%, -100%)", background: C.black, color: "#fff", padding: "6px 10px",
               borderRadius: 8, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 1 }}>
            {formatBRL(data[hover].total)} · {data[hover].count} pedido{data[hover].count === 1 ? "" : "s"}
          </div>
        )}
        <svg width="100%" height={chartH + 26} viewBox={`0 0 ${viewW} ${chartH + 26}`} preserveAspectRatio="xMidYMid meet">
          <line x1={0} y1={chartH} x2={viewW} y2={chartH} stroke={C.line} strokeWidth={1} />
          {data.map((d, i) => {
            const h = max > 0 ? Math.max((d.total / max) * (chartH - 14), d.total > 0 ? 4 : 0) : 0;
            const x = i * unitW + barGap / 2;
            const y = chartH - h;
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
                <rect x={x} y={y - 6} width={barW} height={Math.max(h + 6, 12)} fill="transparent" />
                <rect x={x} y={y} width={barW} height={h} rx={4}
                  fill={hover === i ? C.orange : "rgba(238,108,26,.7)"} />
                <text x={x + barW / 2} y={chartH + 17} textAnchor="middle" fontSize={10.5} fill={C.grayText} fontFamily={FONT}>
                  {d.date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").slice(0, 3)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function TopItemsChart({ orders }) {
  const counts = {};
  orders.forEach((o) => (o.order_items || []).forEach((i) => {
    counts[i.name] = (counts[i.name] || 0) + i.qty;
  }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = Math.max(1, ...top.map(([, q]) => q));

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Itens mais vendidos</div>
      {top.length === 0 ? (
        <p style={{ color: C.grayText, fontSize: 13.5, margin: 0 }}>Sem dados suficientes ainda.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {top.map(([name, qty]) => (
            <div key={name}>
              <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
                <span style={{ fontSize: 12.5, color: C.grayText, fontWeight: 600, flexShrink: 0 }}>{qty}x</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: C.surface, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(qty / max) * 100}%`, background: C.orange, borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const HOUR_BUCKETS = [
  [0, 2], [2, 4], [4, 6], [6, 8], [8, 10], [10, 12],
  [12, 14], [14, 16], [16, 18], [18, 20], [20, 22], [22, 24],
];
const fmtHour = (h) => `${String(h).padStart(2, "0")}:00`;

function BestHourChart({ orders }) {
  const [hover, setHover] = useState(null);
  const buckets = HOUR_BUCKETS.map(([start, end]) => ({
    start, end,
    count: orders.filter((o) => {
      const h = new Date(o.created_at).getHours();
      return h >= start && h < end;
    }).length,
  }));
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const best = buckets.reduce((a, b) => (b.count > a.count ? b : a), buckets[0]);

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>Melhor horário</div>
      {best.count > 0 ? (
        <>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{fmtHour(best.start)} às {fmtHour(best.end)}</div>
          <div style={{ fontSize: 12, color: C.grayText, marginBottom: 18 }}>{best.count} venda{best.count === 1 ? "" : "s"}</div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: C.grayText, marginTop: 4, marginBottom: 18 }}>Sem dados suficientes ainda.</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {buckets.map((b) => (
          <div key={b.start} className="flex items-center gap-2"
            onMouseEnter={() => setHover(b.start)} onMouseLeave={() => setHover(null)}>
            <span style={{ fontSize: 11, color: C.grayText, width: 82, flexShrink: 0 }}>{fmtHour(b.start)} - {fmtHour(b.end)}</span>
            <div style={{ flex: 1, height: 14, background: C.surface, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(b.count / max) * 100}%`,
                   background: b.start === best.start || hover === b.start ? C.orange : "rgba(238,108,26,.4)",
                   borderRadius: 999, transition: "background .12s" }} />
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 600, width: 16, textAlign: "right", flexShrink: 0 }}>{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const WEEKDAYS = [
  { idx: 1, short: "Seg", full: "Segunda-feira" },
  { idx: 2, short: "Ter", full: "Terça-feira" },
  { idx: 3, short: "Qua", full: "Quarta-feira" },
  { idx: 4, short: "Qui", full: "Quinta-feira" },
  { idx: 5, short: "Sex", full: "Sexta-feira" },
  { idx: 6, short: "Sáb", full: "Sábado" },
  { idx: 0, short: "Dom", full: "Domingo" },
];

function BestDayChart({ orders }) {
  const [hover, setHover] = useState(null);
  const counts = WEEKDAYS.map((w) => ({
    ...w,
    count: orders.filter((o) => new Date(o.created_at).getDay() === w.idx).length,
  }));
  const max = Math.max(1, ...counts.map((c) => c.count));
  const best = counts.reduce((a, b) => (b.count > a.count ? b : a), counts[0]);
  const chartH = 110;
  const barW = 28;
  const barGap = 14;
  const unitW = barW + barGap;
  const viewW = counts.length * unitW;

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>Melhor dia</div>
      {best.count > 0 ? (
        <>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{best.full}</div>
          <div style={{ fontSize: 12, color: C.grayText, marginBottom: 16 }}>{best.count} venda{best.count === 1 ? "" : "s"}</div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: C.grayText, marginTop: 4, marginBottom: 16 }}>Sem dados suficientes ainda.</div>
      )}
      <div style={{ position: "relative" }}>
        {hover !== null && (
          <div style={{ position: "absolute", top: 0, left: `${((hover * unitW + unitW / 2) / viewW) * 100}%`,
               transform: "translate(-50%, -100%)", background: C.black, color: "#fff", padding: "6px 10px",
               borderRadius: 8, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 1 }}>
            {counts[hover].count} venda{counts[hover].count === 1 ? "" : "s"}
          </div>
        )}
        <svg width="100%" height={chartH + 24} viewBox={`0 0 ${viewW} ${chartH + 24}`} preserveAspectRatio="xMidYMid meet">
          <line x1={0} y1={chartH} x2={viewW} y2={chartH} stroke={C.line} strokeWidth={1} />
          {counts.map((c, i) => {
            const h = max > 0 ? Math.max((c.count / max) * (chartH - 12), c.count > 0 ? 4 : 0) : 0;
            const x = i * unitW + barGap / 2;
            const y = chartH - h;
            const isBest = c.idx === best.idx;
            return (
              <g key={c.idx} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
                <rect x={x} y={y - 6} width={barW} height={Math.max(h + 6, 12)} fill="transparent" />
                <rect x={x} y={y} width={barW} height={h} rx={4} fill={isBest || hover === i ? C.orange : "rgba(238,108,26,.55)"} />
                <text x={x + barW / 2} y={chartH + 16} textAnchor="middle" fontSize={10.5} fill={C.grayText} fontFamily={FONT}>
                  {c.short}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

const PAYMENT_LABELS = { pix: "Pix", card: "Cartão", cash: "Dinheiro" };

function PaymentMethodsChart({ orders }) {
  const counts = {};
  orders.forEach((o) => {
    const key = o.payment_method || "outros";
    counts[key] = (counts[key] || 0) + 1;
  });
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...rows.map(([, c]) => c));

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Formas de pagamento mais usadas</div>
      {rows.length === 0 ? (
        <p style={{ color: C.grayText, fontSize: 13.5, margin: 0 }}>Sem dados suficientes ainda.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map(([key, count]) => (
            <div key={key}>
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{PAYMENT_LABELS[key] || key}</span>
                <span style={{ fontSize: 12.5, color: C.grayText, fontWeight: 600, flexShrink: 0 }}>
                  {count} pedido{count === 1 ? "" : "s"}
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: C.surface, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(count / max) * 100}%`, background: C.orange, borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComplementsManager({ item, onChange }) {
  const [addingGroup, setAddingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupRequired, setGroupRequired] = useState(false);
  const [groupMin, setGroupMin] = useState(0);
  const [groupMax, setGroupMax] = useState(1);
  const [addingItemFor, setAddingItemFor] = useState(null);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const groups = item.complement_groups || [];

  async function handleAddGroup(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createComplementGroup(item.id, {
        name: groupName,
        required: groupRequired,
        min_qty: groupRequired ? Math.max(1, Number(groupMin) || 1) : Math.max(0, Number(groupMin) || 0),
        max_qty: Math.max(1, Number(groupMax) || 1),
      });
      setGroupName(""); setGroupRequired(false); setGroupMin(0); setGroupMax(1); setAddingGroup(false);
      onChange();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGroup(groupId) {
    if (!window.confirm("Remover esse grupo e todos os complementos dele?")) return;
    await deleteComplementGroup(groupId);
    onChange();
  }

  async function handleAddItem(e, groupId) {
    e.preventDefault();
    setSaving(true);
    try {
      await createComplementItem(groupId, { name: itemName, price: Number(itemPrice) || 0 });
      setItemName(""); setItemPrice(""); setAddingItemFor(null);
      onChange();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(itemId) {
    await deleteComplementItem(itemId);
    onChange();
  }

  return (
    <div style={{ marginTop: 12, padding: 14, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Complementos</div>
      {groups.length === 0 && (
        <p style={{ fontSize: 12.5, color: C.grayText, margin: "0 0 10px" }}>Nenhum grupo de complementos ainda.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {groups.map((group) => (
          <div key={group.id} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 10, background: "#fff" }}>
            <div className="flex items-center justify-between">
              <div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{group.name}</span>
                <span style={{ fontSize: 11, color: C.grayText, marginLeft: 6 }}>
                  {group.min_qty > 0 ? "Obrigatório" : "Opcional"} · mín {group.min_qty} / máx {group.max_qty}
                </span>
              </div>
              <button onClick={() => handleDeleteGroup(group.id)}
                style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${C.line}`, background: "#fff",
                         cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Trash2 size={13} color="#B42318" />
              </button>
            </div>

            {(group.complement_items || []).length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {group.complement_items.map((ci) => (
                  <div key={ci.id} className="flex items-center justify-between" style={{ fontSize: 12.5 }}>
                    <span>{ci.name}{Number(ci.price) > 0 && ` · +${formatBRL(ci.price)}`}</span>
                    <button onClick={() => handleDeleteItem(ci.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.grayText, padding: 2 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {addingItemFor === group.id ? (
              <form onSubmit={(e) => handleAddItem(e, group.id)} className="flex items-center gap-2" style={{ marginTop: 8 }}>
                <input required value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Nome"
                  style={{ flex: 1, minWidth: 0, border: `1.5px solid ${C.line}`, borderRadius: 8, padding: "6px 8px",
                           fontFamily: FONT, fontSize: 12.5 }} />
                <input type="number" min="0" step="0.01" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="R$"
                  style={{ width: 64, flexShrink: 0, border: `1.5px solid ${C.line}`, borderRadius: 8, padding: "6px 8px",
                           fontFamily: FONT, fontSize: 12.5 }} />
                <button type="submit" disabled={saving}
                  style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px",
                           cursor: "pointer", fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>
                  OK
                </button>
                <button type="button" onClick={() => setAddingItemFor(null)}
                  style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 10px",
                           cursor: "pointer", fontSize: 12.5, flexShrink: 0 }}>
                  ×
                </button>
              </form>
            ) : (
              <button onClick={() => setAddingItemFor(group.id)} className="flex items-center gap-1"
                style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", color: C.orange,
                         fontSize: 12.5, fontWeight: 600, padding: 0 }}>
                <Plus size={12} /> Adicionar opção
              </button>
            )}
          </div>
        ))}
      </div>

      {addingGroup ? (
        <form onSubmit={handleAddGroup} style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8,
             background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10, padding: 10 }}>
          <input required value={groupName} onChange={(e) => setGroupName(e.target.value)}
            placeholder="Nome do grupo (ex: Turbine seu lanche)"
            style={{ border: `1.5px solid ${C.line}`, borderRadius: 8, padding: "7px 9px", fontFamily: FONT, fontSize: 12.5 }} />
          <label className="flex items-center gap-2" style={{ fontSize: 12.5 }}>
            <input type="checkbox" checked={groupRequired} onChange={(e) => setGroupRequired(e.target.checked)} />
            Obrigatório
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2" style={{ fontSize: 11.5, color: C.grayText }}>
              Mín
              <input type="number" min="0" value={groupMin} onChange={(e) => setGroupMin(e.target.value)}
                style={{ width: 50, border: `1.5px solid ${C.line}`, borderRadius: 8, padding: "5px 7px",
                         fontFamily: FONT, fontSize: 12.5 }} />
            </label>
            <label className="flex items-center gap-2" style={{ fontSize: 11.5, color: C.grayText }}>
              Máx
              <input type="number" min="1" value={groupMax} onChange={(e) => setGroupMax(e.target.value)}
                style={{ width: 50, border: `1.5px solid ${C.line}`, borderRadius: 8, padding: "5px 7px",
                         fontFamily: FONT, fontSize: 12.5 }} />
            </label>
          </div>
          <div className="flex" style={{ gap: 8 }}>
            <button type="submit" disabled={saving}
              style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px",
                       cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
              Salvar grupo
            </button>
            <button type="button" onClick={() => setAddingGroup(false)}
              style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "7px 14px",
                       cursor: "pointer", fontSize: 12.5, color: C.grayText }}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAddingGroup(true)} className="flex items-center gap-1"
          style={{ marginTop: 12, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, cursor: "pointer",
                   padding: "7px 12px", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: C.black }}>
          <Plus size={13} /> Adicionar grupo
        </button>
      )}
    </div>
  );
}

function OrderCard({ order, onStatusChange, onOpenChat }) {
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
      {order.scheduled_for && (
        <div style={{ display: "inline-block", marginTop: 6, background: "rgba(238,108,26,.1)", color: C.orange,
             fontSize: 11.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>
          Agendado para {new Date(order.scheduled_for).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </div>
      )}
      <div style={{ fontSize: 13, color: C.grayText, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {order.address}
      </div>
      <div style={{ marginTop: 8 }}>
        {(order.order_items || []).map((i) => (
          <div key={i.id} style={{ fontSize: 13, marginBottom: 4 }}>
            {i.qty}x {i.name}
            {i.notes && <span style={{ color: C.orange, fontStyle: "italic" }}> — Obs: {i.notes}</span>}
            {i.complements && i.complements.length > 0 && (
              <div style={{ fontSize: 12, color: C.grayText, marginTop: 1 }}>
                + {i.complements.map((c) => c.name).join(", ")}
              </div>
            )}
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
      {order.customer_id && (
        <button onClick={() => onOpenChat(order)} className="flex items-center justify-center gap-1"
          style={{ width: "100%", marginTop: 8, background: "none", border: `1px solid ${C.line}`, borderRadius: 8,
                   cursor: "pointer", padding: "7px 0", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: C.grayText }}>
          <MessageCircle size={13} /> Conversa
        </button>
      )}
    </div>
  );
}

function OrderChatModal({ order, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(20,20,20,.5)", display: "flex",
         alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: "#fff",
           borderRadius: 18, padding: 18 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Pedido #{order.id.slice(0, 8)}</span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 999, border: `1px solid ${C.line}`,
               background: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}>
            <X size={15} />
          </button>
        </div>
        <OrderChat orderId={order.id} sender="restaurant" emptyLabel="Nenhuma mensagem do cliente ainda." />
      </div>
    </div>
  );
}

function MercadoPagoCard({ restaurant, onDisconnected }) {
  const clientId = import.meta.env.VITE_MP_CLIENT_ID;
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    if (!window.confirm("Desconectar o Mercado Pago? Os clientes vão voltar a pagar só na entrega até você conectar de novo.")) return;
    setDisconnecting(true);
    try {
      await fetch("/api/mp-disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: restaurant.id }),
      });
      await onDisconnected?.();
    } finally {
      setDisconnecting(false);
    }
  }

  if (restaurant.mp_connected) {
    return (
      <div className="flex items-center justify-between gap-2" style={{ background: "rgba(46,158,91,.08)", border: `1px solid ${C.line}`,
           borderRadius: 14, padding: "12px 16px", marginBottom: 14, flexWrap: "wrap" }}>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={17} color={C.ok} />
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>Mercado Pago conectado — você já pode receber pagamentos online.</span>
        </div>
        <button onClick={handleDisconnect} disabled={disconnecting}
          style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 8, cursor: disconnecting ? "default" : "pointer",
                   padding: "6px 12px", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: "#B42318", flexShrink: 0 }}>
          {disconnecting ? "Desconectando…" : "Desconectar"}
        </button>
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

function HeartForkMark({ size = 32 }) {
  return (
    <img src={LOGO_MARK_HEART} alt="Vem Provar" width={size} height={size}
      style={{ display: "block", objectFit: "contain" }} draggable={false} />
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
            <HeartForkMark size={32} />
          ) : (
            <img src={WORDMARK_DARK} alt="Vem Provar" style={{ height: 30, width: "auto", display: "block" }} draggable={false} />
          )}
        </Link>
        <NotificationBell />
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
  const [expandedComplements, setExpandedComplements] = useState(null);
  const [activeSection, setActiveSection] = useState("inicio");
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("vp_sidebar_collapsed") === "1");
  const [chatOrder, setChatOrder] = useState(null);
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

  useEffect(() => {
    if (user) subscribeToPush(user.id);
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
                              list.map((order) => <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} onOpenChat={setChatOrder} />)
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeSection === "loja" && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Dados da loja</h2>
                <RestaurantProfileForm restaurant={restaurant} onSaved={reload} />
              </>
            )}

            {activeSection === "desempenho" && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 18px" }}>Desempenho</h2>
                <div className="vp-dash-stats" style={{ marginBottom: 24 }}>
                  <StatTile icon={Receipt} label="Pedidos (total)" value={orders.length} />
                  <StatTile icon={TrendingUp} label="Faturamento (total)" value={formatBRL(orders.reduce((s, o) => s + Number(o.total), 0))} />
                  <StatTile icon={Coins} label="Ticket médio" value={formatBRL(avgTicket)} />
                  <StatTile icon={Wallet} label="Você recebeu" value={formatBRL(totalPayout)} />
                </div>
                <div className="vp-dash-grid">
                  <RevenueBarChart orders={orders} />
                  <TopItemsChart orders={orders} />
                </div>
                <div className="vp-dash-grid" style={{ marginTop: 24 }}>
                  <BestHourChart orders={orders} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <BestDayChart orders={orders} />
                    <PaymentMethodsChart orders={orders} />
                  </div>
                </div>
              </>
            )}

            {activeSection === "financeiro" && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 18px" }}>Financeiro</h2>
                <MercadoPagoCard restaurant={restaurant} onDisconnected={reload} />
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
                          <div style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, overflow: "hidden",
                               background: C.surface, display: "grid", placeItems: "center" }}>
                            {item.image_url ? (
                              <img src={item.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <ImagePlus size={18} color={C.gray} />
                            )}
                          </div>
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
                        <div className="flex items-center" style={{ gap: 8, marginTop: 8 }}>
                          <button onClick={() => handleToggleAvailable(item)} className="flex items-center justify-center gap-1"
                            style={{ flex: 1, background: "none", border: `1px solid ${C.line}`,
                                     borderRadius: 8, cursor: "pointer", padding: "8px 0", fontFamily: FONT, fontSize: 13,
                                     fontWeight: 600, color: item.available === false ? C.ok : C.grayText }}>
                            {item.available === false ? <><Play size={14} /> Retomar vendas</> : <><Pause size={14} /> Pausar vendas</>}
                          </button>
                          <button onClick={() => setExpandedComplements(expandedComplements === item.id ? null : item.id)}
                            className="flex items-center justify-center gap-1"
                            style={{ flex: 1, background: "none", border: `1px solid ${C.line}`,
                                     borderRadius: 8, cursor: "pointer", padding: "8px 0", fontFamily: FONT, fontSize: 13,
                                     fontWeight: 600, color: C.grayText }}>
                            <ListPlus size={14} /> Complementos
                            {(item.complement_groups || []).length > 0 && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: C.orange, background: "rgba(238,108,26,.1)",
                                   borderRadius: 999, minWidth: 16, height: 16, display: "grid", placeItems: "center", padding: "0 4px" }}>
                                {item.complement_groups.length}
                              </span>
                            )}
                            {expandedComplements === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                        {expandedComplements === item.id && (
                          <ComplementsManager item={item} onChange={reload} />
                        )}
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
      {chatOrder && <OrderChatModal order={chatOrder} onClose={() => setChatOrder(null)} />}
    </div>
  );
}
