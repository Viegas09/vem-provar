import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CreditCard, QrCode, Banknote, Bike, Store, Check, Plus, Pencil } from "lucide-react";
import { C, FONT, formatBRL } from "../theme";
import { useRestaurant } from "../hooks/useRestaurant";
import { useCart } from "../context/CartContext";
import { useUserLocation } from "../hooks/useUserLocation";
import { useAuth } from "../context/AuthContext";
import { createOrder, fetchAddresses, createAddress, updateAddress } from "../data/queries";
import { getCommissionRate, calculateCommission } from "../lib/commission";
import { formatAddress } from "../lib/geolocation";
import Header from "../components/Header";
import LocateButton from "../components/LocateButton";
import AddressModal, { emptyAddressForm } from "../components/AddressModal";

const PAYMENT_METHODS = [
  { id: "pix", label: "Pix", icon: QrCode },
  { id: "card", label: "Cartão na entrega", icon: CreditCard },
  { id: "cash", label: "Dinheiro", icon: Banknote },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, subtotal, clearCart } = useCart();
  const { restaurant } = useRestaurant(cart.restaurantSlug);
  const [deliveryMode, setDeliveryMode] = useState("delivery");
  const isPickup = deliveryMode === "pickup";
  const deliveryFee = isPickup ? 0 : restaurant ? Number(restaurant.delivery_fee) : 0;
  const total = subtotal + deliveryFee;

  const [location, setLocation] = useUserLocation();
  const [address, setAddress] = useState(location.address || "");
  const [payment, setPayment] = useState("pix");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const submittedRef = useRef(false);

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
    if (restaurant.is_open === false) {
      setSubmitError("Esse restaurante está fechado no momento e não pode receber pedidos agora.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const commissionRate = getCommissionRate(restaurant);
      const { commissionAmount, restaurantPayout } = calculateCommission(subtotal, commissionRate);
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
        total,
        items: cart.items,
        commissionRate,
        commissionAmount,
        restaurantPayout,
      });
      submittedRef.current = true;

      if ((payment === "pix" || payment === "card") && restaurant.mp_connected) {
        try {
          const mpRes = await fetch("/api/mp-create-preference", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: order.id, origin: window.location.origin }),
          });
          const mpData = await mpRes.json();
          console.log("checkout: mp-create-preference response", mpRes.status, mpData);
          const checkoutUrl = mpData.initPoint || mpData.sandboxInitPoint;
          if (mpRes.ok && checkoutUrl) {
            clearCart();
            window.location.href = checkoutUrl;
            return;
          }
        } catch (mpErr) {
          console.error("checkout: mp-create-preference fetch threw", mpErr);
          // segue pro fluxo padrão se o Mercado Pago falhar — o pedido já foi criado
        }
      }

      clearCart();
      navigate("/pedido-confirmado", { state: { orderId: order.id, orderNumber: order.id.slice(0, 8), total, payment } });
    } catch (err) {
      setSubmitError("Não foi possível confirmar o pedido. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />

      <form onSubmit={handleConfirm} className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: 640 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 20px" }}>Finalizar pedido</h1>

        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Opções de entrega</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          <button type="button" onClick={() => setDeliveryMode("delivery")} className="flex items-center gap-3"
            style={{ background: !isPickup ? "rgba(238,108,26,.08)" : "#fff",
                     border: `1.5px solid ${!isPickup ? C.orange : C.line}`, borderRadius: 12,
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
                     border: `1.5px solid ${isPickup ? C.orange : C.line}`, borderRadius: 12,
                     padding: "14px 16px", cursor: "pointer", textAlign: "left" }}>
            <Store size={19} color={isPickup ? C.orange : C.grayText} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: isPickup ? 700 : 600 }}>Retirar no local</div>
              <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 1 }}>Grátis · sem taxa de entrega</div>
            </div>
            {isPickup && <Check size={17} color={C.orange} style={{ flexShrink: 0 }} />}
          </button>
        </div>

        {isPickup ? (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.grayText, marginBottom: 6 }}>Endereço do restaurante</div>
            <div className="flex items-center gap-2" style={{ background: C.surface, borderRadius: 12, padding: "12px 14px" }}>
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
                             border: `1.5px solid ${active ? C.orange : C.line}`, borderRadius: 12,
                             padding: "12px 14px", cursor: "pointer", textAlign: "left" }}>
                    <MapPin size={18} color={active ? C.orange : C.grayText} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{a.label}</div>
                      <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 1 }}>{formatAddress(a)}</div>
                    </div>
                    {active && <Check size={17} color={C.orange} style={{ flexShrink: 0 }} />}
                    <button type="button" onClick={(e) => { e.stopPropagation(); setAddressModal(a); }}
                      style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff",
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
                style={{ width: "100%", background: C.surface, border: "none", borderRadius: 12, padding: "14px 16px",
                         cursor: "pointer", fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.orange, justifyContent: "center" }}>
                <Plus size={15} /> Adicionar endereço de entrega
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2" style={{ background: "#fff", border: `1.5px solid ${C.line}`,
                     borderRadius: 12, padding: "0 14px", minHeight: 54 }}>
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
          {PAYMENT_METHODS.map((m) => {
            const Icon = m.icon;
            const active = payment === m.id;
            const label = m.id === "card" ? (isPickup ? "Cartão na retirada" : "Cartão na entrega") : m.label;
            return (
              <button key={m.id} type="button" onClick={() => setPayment(m.id)} className="flex items-center gap-3"
                style={{ background: active ? "rgba(238,108,26,.08)" : "#fff",
                         border: `1.5px solid ${active ? C.orange : C.line}`, borderRadius: 12,
                         padding: "14px 16px", cursor: "pointer", textAlign: "left" }}>
                <Icon size={19} color={active ? C.orange : C.grayText} />
                <span style={{ fontSize: 14.5, fontWeight: active ? 600 : 500 }}>{label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 18, marginBottom: 20 }}>
          <div className="flex items-center justify-between" style={{ fontSize: 14.5, color: C.grayText, marginBottom: 6 }}>
            <span>Subtotal</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between" style={{ fontSize: 14.5, color: C.grayText, marginBottom: 10 }}>
            <span>Taxa de entrega</span>
            <span>{deliveryFee === 0 ? "Grátis" : formatBRL(deliveryFee)}</span>
          </div>
          <div className="flex items-center justify-between" style={{ fontSize: 18, fontWeight: 700 }}>
            <span>Total</span>
            <span>{formatBRL(total)}</span>
          </div>
        </div>

        {restaurant?.is_open === false && (
          <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 16 }}>
            Esse restaurante está fechado no momento e não pode receber pedidos agora.
          </div>
        )}

        {submitError && (
          <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 16 }}>
            {submitError}
          </div>
        )}

        <button type="submit" disabled={submitting || restaurant?.is_open === false}
          style={{ width: "100%", background: submitting || restaurant?.is_open === false ? C.gray : C.orange, color: "#fff", border: "none",
                   cursor: submitting || restaurant?.is_open === false ? "default" : "pointer", borderRadius: 12, padding: "15px 0", fontFamily: FONT,
                   fontSize: 15.5, fontWeight: 600 }}>
          {submitting ? "Confirmando…" : "Confirmar pedido"}
        </button>
      </form>

      {addressModal && (
        <AddressModal initial={addressModal.id ? addressModal : null} onClose={() => setAddressModal(null)} onSave={handleSaveAddress} />
      )}
    </div>
  );
}
