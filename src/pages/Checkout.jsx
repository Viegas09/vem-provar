import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CreditCard, QrCode, Banknote, Bike, Store, Check, Plus, Pencil, Tag, X, Clock, CalendarClock } from "lucide-react";
import { C, FONT, formatBRL, RADIUS } from "../theme";
import { useRestaurant } from "../hooks/useRestaurant";
import { useAppMode } from "../hooks/useAppMode";
import { useCart } from "../context/CartContext";
import { useUserLocation } from "../hooks/useUserLocation";
import { useAuth } from "../context/AuthContext";
import { createOrder, fetchAddresses, createAddress, updateAddress, fetchCouponByCode, redeemCoupon } from "../data/queries";
import { getCommissionRate, calculateCommission } from "../lib/commission";
import { formatAddress } from "../lib/geolocation";
import { isRestaurantOpenNow } from "../lib/businessHours";
import Header from "../components/Header";
import LocateButton from "../components/LocateButton";
import AddressModal, { emptyAddressForm } from "../components/AddressModal";
import PixPayment from "../components/PixPayment";
import CardPaymentBrick from "../components/CardPaymentBrick";

const PAYMENT_METHODS = [
  { id: "pix", label: "Pix", icon: QrCode },
  { id: "card_online", label: "Cartão de crédito (online)", icon: CreditCard },
  { id: "card", label: "Cartão na entrega", icon: CreditCard },
  { id: "cash", label: "Dinheiro", icon: Banknote },
];

const SCHEDULE_DAYS = [
  { offset: 0, label: "Hoje" },
  { offset: 1, label: "Amanhã" },
];

// gera horários de meia em meia hora, com pelo menos 45min de folga a partir de agora (hoje) ou 9h-22h (amanhã)
function buildTimeSlots(dayOffset) {
  const day = new Date();
  day.setDate(day.getDate() + dayOffset);
  day.setSeconds(0, 0);

  let cursor;
  if (dayOffset === 0) {
    cursor = new Date(Date.now() + 45 * 60000);
    const remainder = cursor.getMinutes() % 30;
    if (remainder !== 0) cursor.setMinutes(cursor.getMinutes() + (30 - remainder));
    cursor.setSeconds(0, 0);
  } else {
    cursor = new Date(day);
    cursor.setHours(9, 0, 0, 0);
  }

  const end = new Date(day);
  end.setHours(22, 0, 0, 0);

  const slots = [];
  while (cursor <= end) {
    slots.push(new Date(cursor));
    cursor = new Date(cursor.getTime() + 30 * 60000);
  }
  return slots;
}

function computeDiscount(coupon, subtotalValue) {
  if (!coupon) return 0;
  const raw = coupon.discount_type === "percent"
    ? (subtotalValue * Number(coupon.discount_value)) / 100
    : Number(coupon.discount_value);
  return Math.min(raw, subtotalValue);
}

export default function Checkout() {
  const navigate = useNavigate();
  const isAppMode = useAppMode();
  const { user } = useAuth();
  const { cart, subtotal, clearCart } = useCart();
  const { restaurant } = useRestaurant(cart.restaurantSlug);
  const [deliveryMode, setDeliveryMode] = useState("delivery");
  const isPickup = deliveryMode === "pickup";
  const deliveryFee = isPickup ? 0 : restaurant ? Number(restaurant.delivery_fee) : 0;

  const [location, setLocation] = useUserLocation();
  const [address, setAddress] = useState(location.address || "");
  const [payment, setPayment] = useState("pix");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [paymentStep, setPaymentStep] = useState(null);
  const submittedRef = useRef(false);

  const [scheduleMode, setScheduleMode] = useState("now");
  const [scheduleDay, setScheduleDay] = useState(() => (buildTimeSlots(0).length > 0 ? 0 : 1));
  const [scheduledFor, setScheduledFor] = useState(null);
  const daySlots = buildTimeSlots(scheduleDay);

  function handleScheduleLater() {
    setScheduleMode("later");
    if (!scheduledFor) {
      const slots = buildTimeSlots(scheduleDay);
      if (slots.length > 0) setScheduledFor(slots[0]);
    }
  }

  function handleChangeDay(offset) {
    setScheduleDay(offset);
    const slots = buildTimeSlots(offset);
    setScheduledFor(slots.length > 0 ? slots[0] : null);
  }

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const discount = computeDiscount(appliedCoupon, subtotal);
  const total = subtotal + deliveryFee - discount;

  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code || !restaurant) return;
    setCouponChecking(true);
    setCouponError(null);
    try {
      const coupon = await fetchCouponByCode(code);
      if (!coupon) throw new Error("Cupom não encontrado.");
      if (!coupon.active) throw new Error("Esse cupom não está mais ativo.");
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) throw new Error("Esse cupom expirou.");
      if (coupon.restaurant_id && coupon.restaurant_id !== restaurant.id) throw new Error("Esse cupom não vale para este restaurante.");
      if (subtotal < Number(coupon.min_order_value)) throw new Error(`Esse cupom exige um pedido mínimo de ${formatBRL(coupon.min_order_value)}.`);
      if (coupon.max_uses != null && coupon.uses_count >= coupon.max_uses) throw new Error("Esse cupom já atingiu o limite de usos.");
      setAppliedCoupon(coupon);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.message || "Não foi possível aplicar o cupom.");
    } finally {
      setCouponChecking(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressModal, setAddressModal] = useState(null);

  function handleLocated({ latitude, longitude, address: found }) {
    const nextAddress = found || address;
    setAddress(nextAddress);
    setLocation({ address: nextAddress, latitude, longitude });
  }

  useEffect(() => {
    if (!user) return;
    fetchAddresses(user.id).then((data) => {
      setSavedAddresses(data);
      const def = data.find((a) => a.is_default) || data[0];
      if (def) setSelectedAddressId(def.id);
    });
  }, [user]);

  useEffect(() => {
    if (cart.items.length === 0 && !submittedRef.current) navigate("/carrinho");
  }, [cart.items.length, navigate]);

  if (cart.items.length === 0 && !submittedRef.current) return null;

  async function handleSaveAddress(form) {
    const payload = {
      label: form.label,
      street: form.street.trim(),
      number: form.number.trim(),
      neighborhood: form.neighborhood.trim() || null,
      city: form.city.trim() || null,
      cep: form.cep.trim() || null,
      latitude: form.latitude,
      longitude: form.longitude,
    };
    if (addressModal?.id) {
      await updateAddress(addressModal.id, payload);
      setSavedAddresses((prev) => prev.map((a) => (a.id === addressModal.id ? { ...a, ...payload } : a)));
    } else {
      const created = await createAddress({ ...payload, user_id: user.id, is_default: savedAddresses.length === 0 });
      setSavedAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created.id);
    }
    setAddressModal(null);
  }

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);
  const usingSavedAddresses = savedAddresses.length > 0;

  async function handleConfirm(e) {
    e.preventDefault();
    if (!restaurant) return;
    if (!isPickup && (usingSavedAddresses ? !selectedAddress : !address.trim())) return;
    if (scheduleMode === "later" && !scheduledFor) return;
    if (!isRestaurantOpenNow(restaurant)) {
      setSubmitError("Esse restaurante está fechado no momento e não pode receber pedidos agora.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      let finalDiscount = discount;
      let redeemedCode = null;
      if (appliedCoupon) {
        try {
          const redeemed = await redeemCoupon({ code: appliedCoupon.code, restaurantId: restaurant.id, subtotal });
          finalDiscount = computeDiscount(redeemed, subtotal);
          redeemedCode = redeemed.code;
        } catch {
          setSubmitError("O cupom não pôde ser aplicado agora (pode ter expirado ou atingido o limite de usos). Remova o cupom e tente novamente.");
          setSubmitting(false);
          return;
        }
      }

      const orderTotal = subtotal + deliveryFee - finalDiscount;
      const commissionRate = getCommissionRate(restaurant);
      const { commissionAmount, restaurantPayout: payoutBeforeDiscount } = calculateCommission(subtotal, commissionRate);
      // o cupom sai do repasse do restaurante — a comissão da plataforma é sempre sobre o subtotal cheio, sem desconto
      const restaurantPayout = Math.max(0, Math.round((payoutBeforeDiscount - finalDiscount) * 100) / 100);
      const orderAddress = isPickup
        ? `Retirada no local · ${restaurant.name}, ${restaurant.address}`
        : usingSavedAddresses
        ? formatAddress(selectedAddress)
        : address;
      const order = await createOrder({
        restaurantId: restaurant.id,
        customerId: user?.id,
        address: orderAddress,
        paymentMethod: payment,
        subtotal,
        deliveryFee,
        total: orderTotal,
        items: cart.items,
        commissionRate,
        commissionAmount,
        restaurantPayout,
        couponCode: redeemedCode,
        discountAmount: finalDiscount,
        scheduledFor: scheduleMode === "later" && scheduledFor ? scheduledFor.toISOString() : null,
      });
      submittedRef.current = true;

      if ((payment === "pix" || payment === "card_online") && restaurant.mp_connected) {
        clearCart();
        setPaymentStep({ orderId: order.id, method: payment, total: orderTotal });
        setSubmitting(false);
        return;
      }

      clearCart();
      navigate("/pedido-confirmado", { state: { orderId: order.id, orderNumber: order.id.slice(0, 8), total: orderTotal, payment,
           scheduledFor: scheduleMode === "later" && scheduledFor ? scheduledFor.toISOString() : null } });
    } catch (err) {
      setSubmitError("Não foi possível confirmar o pedido. Tente novamente.");
      setSubmitting(false);
    }
  }

  if (paymentStep) {
    const orderNumber = paymentStep.orderId.slice(0, 8);
    function handlePaid() {
      navigate("/pedido-confirmado", { state: { orderId: paymentStep.orderId, orderNumber, total: paymentStep.total, payment: paymentStep.method } });
    }
    function handleCancelPayment() {
      navigate(`/pedido/${paymentStep.orderId}`);
    }
    return (
      <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
        <Header />
        <div className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: 480 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Pagamento</h1>
          {paymentStep.method === "pix" ? (
            <PixPayment orderId={paymentStep.orderId} total={paymentStep.total} defaultEmail={user?.email}
              onPaid={handlePaid} onCancel={handleCancelPayment} />
          ) : (
            <CardPaymentBrick orderId={paymentStep.orderId} total={paymentStep.total}
              onPaid={handlePaid} onCancel={handleCancelPayment} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />

      <form onSubmit={handleConfirm} className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: isAppMode ? 640 : 980 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 20px" }}>Finalizar pedido</h1>

        <div className={isAppMode ? undefined : "vp-checkout-grid"}>
        <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Opções de entrega</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          <button type="button" onClick={() => setDeliveryMode("delivery")} className="flex items-center gap-3"
            style={{ background: !isPickup ? "rgba(238,108,26,.08)" : "#fff",
                     border: `1.5px solid ${!isPickup ? C.orange : C.line}`, borderRadius: RADIUS.md,
                     padding: "14px 16px", cursor: "pointer", textAlign: "left" }}>
            <Bike size={19} color={!isPickup ? C.orange : C.grayText} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: !isPickup ? 700 : 600 }}>Entrega</div>
              <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 1 }}>
                {restaurant?.delivery_time || "30-50"} min · {restaurant && Number(restaurant.delivery_fee) === 0 ? "Grátis" : formatBRL(restaurant ? Number(restaurant.delivery_fee) : 0)}
              </div>
            </div>
            {!isPickup && <Check size={17} color={C.orange} style={{ flexShrink: 0 }} />}
          </button>
          <button type="button" onClick={() => setDeliveryMode("pickup")} className="flex items-center gap-3"
            style={{ background: isPickup ? "rgba(238,108,26,.08)" : "#fff",
                     border: `1.5px solid ${isPickup ? C.orange : C.line}`, borderRadius: RADIUS.md,
                     padding: "14px 16px", cursor: "pointer", textAlign: "left" }}>
            <Store size={19} color={isPickup ? C.orange : C.grayText} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: isPickup ? 700 : 600 }}>Retirar no local</div>
              <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 1 }}>Grátis · sem taxa de entrega</div>
            </div>
            {isPickup && <Check size={17} color={C.orange} style={{ flexShrink: 0 }} />}
          </button>
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Quando você quer receber?</h2>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" onClick={() => setScheduleMode("now")} className="flex items-center gap-3"
              style={{ background: scheduleMode === "now" ? "rgba(238,108,26,.08)" : "#fff",
                       border: `1.5px solid ${scheduleMode === "now" ? C.orange : C.line}`, borderRadius: RADIUS.md,
                       padding: "14px 16px", cursor: "pointer", textAlign: "left" }}>
              <Clock size={19} color={scheduleMode === "now" ? C.orange : C.grayText} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: scheduleMode === "now" ? 700 : 600 }}>O mais rápido possível</div>
              </div>
              {scheduleMode === "now" && <Check size={17} color={C.orange} style={{ flexShrink: 0 }} />}
            </button>
            <button type="button" onClick={handleScheduleLater} className="flex items-center gap-3"
              style={{ background: scheduleMode === "later" ? "rgba(238,108,26,.08)" : "#fff",
                       border: `1.5px solid ${scheduleMode === "later" ? C.orange : C.line}`, borderRadius: RADIUS.md,
                       padding: "14px 16px", cursor: "pointer", textAlign: "left" }}>
              <CalendarClock size={19} color={scheduleMode === "later" ? C.orange : C.grayText} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: scheduleMode === "later" ? 700 : 600 }}>Agendar para depois</div>
              </div>
              {scheduleMode === "later" && <Check size={17} color={C.orange} style={{ flexShrink: 0 }} />}
            </button>
          </div>

          {scheduleMode === "later" && (
            <div style={{ marginTop: 14 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                {SCHEDULE_DAYS.map((d) => {
                  const slotsForDay = buildTimeSlots(d.offset);
                  if (slotsForDay.length === 0) return null;
                  const active = scheduleDay === d.offset;
                  return (
                    <button key={d.offset} type="button" onClick={() => handleChangeDay(d.offset)}
                      style={{ background: active ? C.black : "#fff", color: active ? "#fff" : C.black,
                               border: `1.5px solid ${active ? C.black : C.line}`, borderRadius: RADIUS.pill, padding: "7px 16px",
                               fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      {d.label}
                    </button>
                  );
                })}
              </div>
              {daySlots.length === 0 ? (
                <p style={{ fontSize: 13, color: C.grayText, margin: 0 }}>Sem horários disponíveis para esse dia.</p>
              ) : (
                <div className="vp-scroll flex" style={{ gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                  {daySlots.map((slot) => {
                    const active = scheduledFor && slot.getTime() === scheduledFor.getTime();
                    return (
                      <button key={slot.getTime()} type="button" onClick={() => setScheduledFor(slot)}
                        style={{ flexShrink: 0, background: active ? C.orange : "#fff", color: active ? "#fff" : C.black,
                                 border: `1.5px solid ${active ? C.orange : C.line}`, borderRadius: RADIUS.sm, padding: "9px 14px",
                                 fontFamily: FONT, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                        {slot.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </button>
                    );
                  })}
                </div>
              )}
              <p style={{ fontSize: 12, color: C.grayText, margin: "10px 0 0" }}>
                O restaurante vai preparar seu pedido pra esse horário — os prazos de preparo ainda dependem de cada loja.
              </p>
            </div>
          )}
        </div>

        {isPickup ? (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.grayText, marginBottom: 6 }}>Endereço do restaurante</div>
            <div className="flex items-center gap-2" style={{ background: C.surface, borderRadius: RADIUS.md, padding: "12px 14px" }}>
              <MapPin size={18} color={C.orange} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: C.black }}>{restaurant?.address}</span>
            </div>
          </div>
        ) : usingSavedAddresses ? (
          <div style={{ marginBottom: 24 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Endereço de entrega</h2>
              <button type="button" onClick={() => setAddressModal(emptyAddressForm())} className="flex items-center gap-1"
                style={{ background: "none", border: "none", cursor: "pointer", color: C.orange,
                         fontFamily: FONT, fontSize: 13, fontWeight: 600, padding: 0 }}>
                <Plus size={14} /> Novo
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {savedAddresses.map((a) => {
                const active = a.id === selectedAddressId;
                return (
                  <div key={a.id} onClick={() => setSelectedAddressId(a.id)} className="flex items-center gap-3"
                    style={{ background: active ? "rgba(238,108,26,.08)" : "#fff",
                             border: `1.5px solid ${active ? C.orange : C.line}`, borderRadius: RADIUS.md,
                             padding: "12px 14px", cursor: "pointer", textAlign: "left" }}>
                    <MapPin size={18} color={active ? C.orange : C.grayText} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{a.label}</div>
                      <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 1 }}>{formatAddress(a)}</div>
                    </div>
                    {active && <Check size={17} color={C.orange} style={{ flexShrink: 0 }} />}
                    <button type="button" onClick={(e) => { e.stopPropagation(); setAddressModal(a); }}
                      aria-label={`Editar endereço ${a.label}`}
                      style={{ width: 30, height: 30, borderRadius: RADIUS.xs, border: `1px solid ${C.line}`, background: "#fff",
                               cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Pencil size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Endereço de entrega</h2>
            {user ? (
              <button type="button" onClick={() => setAddressModal(emptyAddressForm())} className="flex items-center gap-2"
                style={{ width: "100%", background: C.surface, border: "none", borderRadius: RADIUS.md, padding: "14px 16px",
                         cursor: "pointer", fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.orange, justifyContent: "center" }}>
                <Plus size={15} /> Adicionar endereço de entrega
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2" style={{ background: "#fff", border: `1.5px solid ${C.line}`,
                     borderRadius: RADIUS.md, padding: "0 14px", minHeight: 54 }}>
                  <MapPin size={20} color={C.orange} />
                  <input value={address} onChange={(e) => setAddress(e.target.value)} required={!isPickup}
                    placeholder="Rua, número, bairro"
                    style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 15, background: "transparent", color: C.black }} />
                </div>
                <div style={{ marginTop: -6 }}>
                  <LocateButton onLocated={handleLocated} />
                </div>
              </>
            )}
          </div>
        )}

        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Forma de pagamento</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {PAYMENT_METHODS.filter((m) => m.id !== "card_online" || restaurant?.mp_connected).map((m) => {
            const Icon = m.icon;
            const active = payment === m.id;
            const label = m.id === "card" ? (isPickup ? "Cartão na retirada" : "Cartão na entrega") : m.label;
            return (
              <button key={m.id} type="button" onClick={() => setPayment(m.id)} className="flex items-center gap-3"
                style={{ background: active ? "rgba(238,108,26,.08)" : "#fff",
                         border: `1.5px solid ${active ? C.orange : C.line}`, borderRadius: RADIUS.md,
                         padding: "14px 16px", cursor: "pointer", textAlign: "left" }}>
                <Icon size={19} color={active ? C.orange : C.grayText} />
                <span style={{ fontSize: 14.5, fontWeight: active ? 600 : 500 }}>{label}</span>
              </button>
            );
          })}
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Cupom de desconto</h2>
        <div style={{ marginBottom: 24 }}>
          {appliedCoupon ? (
            <div className="flex items-center gap-3" style={{ background: "rgba(46,158,91,.08)", border: `1.5px solid ${C.ok}`,
                 borderRadius: RADIUS.md, padding: "12px 14px" }}>
              <Tag size={18} color={C.ok} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ok }}>{appliedCoupon.code}</div>
                <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 1 }}>
                  {appliedCoupon.discount_type === "percent"
                    ? `${Number(appliedCoupon.discount_value)}% de desconto aplicado`
                    : `${formatBRL(appliedCoupon.discount_value)} de desconto aplicado`}
                </div>
              </div>
              <button type="button" onClick={handleRemoveCoupon} aria-label="Remover cupom"
                style={{ background: "none", border: "none", cursor: "pointer", color: C.grayText, display: "grid", placeItems: "center" }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2" style={{ flex: 1, background: "#fff", border: `1.5px solid ${C.line}`,
                     borderRadius: RADIUS.md, padding: "0 14px", minHeight: 50 }}>
                  <Tag size={17} color={C.grayText} />
                  <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Digite o código do cupom"
                    style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 14.5, background: "transparent", color: C.black }} />
                </div>
                <button type="button" onClick={handleApplyCoupon} disabled={!couponInput.trim() || couponChecking}
                  style={{ background: !couponInput.trim() || couponChecking ? C.gray : C.orange, color: "#fff", border: "none",
                           cursor: !couponInput.trim() || couponChecking ? "default" : "pointer", borderRadius: RADIUS.md,
                           padding: "0 18px", height: 50, fontFamily: FONT, fontSize: 13.5, fontWeight: 600, flexShrink: 0 }}>
                  {couponChecking ? "..." : "Aplicar"}
                </button>
              </div>
              {couponError && <div style={{ color: "#B42318", fontSize: 12.5, marginTop: 6 }}>{couponError}</div>}
            </>
          )}
        </div>
        </div>

        <div className={isAppMode ? undefined : "vp-checkout-summary"}>
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 18, marginBottom: 20 }}>
          <div className="flex items-center justify-between" style={{ fontSize: 14.5, color: C.grayText, marginBottom: 6 }}>
            <span>Subtotal</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between" style={{ fontSize: 14.5, color: C.ok, marginBottom: 6 }}>
              <span>Desconto</span>
              <span>-{formatBRL(discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between" style={{ fontSize: 14.5, color: C.grayText, marginBottom: 10 }}>
            <span>Taxa de entrega</span>
            <span>{deliveryFee === 0 ? "Grátis" : formatBRL(deliveryFee)}</span>
          </div>
          <div className="flex items-center justify-between" style={{ fontSize: 18, fontWeight: 700 }}>
            <span>Total</span>
            <span>{formatBRL(total)}</span>
          </div>
        </div>

        {restaurant && !isRestaurantOpenNow(restaurant) && (
          <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: RADIUS.md, padding: 14, fontSize: 14, marginBottom: 16 }}>
            Esse restaurante está fechado no momento e não pode receber pedidos agora.
          </div>
        )}

        {submitError && (
          <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: RADIUS.md, padding: 14, fontSize: 14, marginBottom: 16 }}>
            {submitError}
          </div>
        )}

        <button type="submit" disabled={submitting || (restaurant && !isRestaurantOpenNow(restaurant)) || (scheduleMode === "later" && !scheduledFor)}
          style={{ width: "100%", background: submitting || (restaurant && !isRestaurantOpenNow(restaurant)) || (scheduleMode === "later" && !scheduledFor) ? C.gray : C.orange, color: "#fff", border: "none",
                   cursor: submitting || (restaurant && !isRestaurantOpenNow(restaurant)) ? "default" : "pointer", borderRadius: RADIUS.md, padding: "15px 0", fontFamily: FONT,
                   fontSize: 15.5, fontWeight: 600 }}>
          {submitting ? "Confirmando…" : scheduleMode === "later" && scheduledFor
            ? `Agendar para ${SCHEDULE_DAYS.find((d) => d.offset === scheduleDay)?.label.toLowerCase()} às ${scheduledFor.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
            : "Confirmar pedido"}
        </button>
        </div>
        </div>
      </form>

      {addressModal && (
        <AddressModal initial={addressModal.id ? addressModal : null} onClose={() => setAddressModal(null)} onSave={handleSaveAddress} />
      )}
    </div>
  );
}
