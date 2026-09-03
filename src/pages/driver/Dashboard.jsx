import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bike, Car, Package, LayoutDashboard, Clock3, LogOut, MapPin, Store, Wallet, TrendingUp,
  CheckCircle2, PauseCircle, ChevronRight, History, User as UserIcon, Bell, X, Navigation,
} from "lucide-react";
import { C, FONT, RADIUS, SHADOW, formatBRL } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { mapsDirectionsUrl, wazeUrl } from "../../lib/geolocation";
import {
  fetchDriverByUser, updateDriver, fetchAvailableDeliveries, fetchDriverOrders, claimDelivery, updateOrderStatus,
  tryClaimOffer, respondToOffer, fetchMyActiveOffer,
} from "../../data/queries";
import { useOrdersRealtime } from "../../hooks/useOrdersRealtime";
import PortalHeader from "../../components/PortalHeader";
import { SkeletonPage } from "../../components/Skeleton";

const VEHICLE_LABELS = { moto: "Moto", bike: "Bicicleta", carro: "Carro" };
const VEHICLE_ICONS = { moto: Bike, bike: Bike, carro: Car };
const OFFER_SECONDS = 20;
const OFFER_POLL_MS = 5000;

function playPingSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch { /* som indisponível, sem problema */ }
}

const NAV_ITEMS = [
  { key: "inicio", label: "Início", icon: LayoutDashboard },
  { key: "historico", label: "Histórico", icon: History },
  { key: "conta", label: "Conta", icon: UserIcon },
];

function relativeTime(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = diffMs / 60000;
  if (diffMin < 1) return "Agora há pouco";
  if (diffMin < 60) return `Há ${Math.round(diffMin)} min`;
  return `Há ${Math.round(diffMin / 60)}h`;
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

// depois de aceita, o entregador precisa ir até o restaurante (buscar) e depois até
// o cliente (entregar) — abre a rota pronta no app de mapas do celular em vez de
// tentar reinventar navegação dentro do app
function NavButtons({ lat, lng, address }) {
  return (
    <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
      <a href={mapsDirectionsUrl(lat, lng, address)} target="_blank" rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center gap-1"
        style={{ flex: 1, background: "#fff", color: C.black, border: `1px solid ${C.line}`, borderRadius: RADIUS.xs,
                 padding: "8px 0", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>
        <Navigation size={13} /> Google Maps
      </a>
      <a href={wazeUrl(lat, lng, address)} target="_blank" rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center gap-1"
        style={{ flex: 1, background: "#fff", color: C.black, border: `1px solid ${C.line}`, borderRadius: RADIUS.xs,
                 padding: "8px 0", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>
        <Navigation size={13} /> Waze
      </a>
    </div>
  );
}

function DeliveryCard({ order, action }) {
  const goingToRestaurant = order.status === "preparing";
  const navTarget = goingToRestaurant
    ? { lat: order.restaurants?.latitude, lng: order.restaurants?.longitude, address: order.restaurants?.address }
    : { lat: order.latitude, lng: order.longitude, address: order.address };

  return (
    <div style={{ padding: 14, background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.lg }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <Store size={14} color={C.grayText} />
        <span style={{ fontSize: 14, fontWeight: 700 }}>{order.restaurants?.name}</span>
        <span style={{ fontSize: 12, color: C.grayText, marginLeft: "auto" }}>{relativeTime(order.created_at)}</span>
      </div>
      <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
        <MapPin size={13} color={C.grayText} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, color: C.grayText }}>{order.restaurants?.address || "—"} → {order.address}</span>
      </div>
      <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
        <span style={{ fontSize: 13, color: C.grayText }}>
          {(order.order_items || []).length} item{(order.order_items || []).length === 1 ? "" : "s"} · pedido {formatBRL(order.total)}
        </span>
        <span className="flex items-center gap-1" style={{ fontSize: 14.5, fontWeight: 700, color: C.ok }}>
          <Wallet size={14} /> {formatBRL(order.delivery_fee ?? 0)}
        </span>
      </div>
      {action && <NavButtons {...navTarget} />}
      {action}
    </div>
  );
}

function RideOfferModal({ offer, onAccept, onDecline, working }) {
  const order = offer.orders;
  const [secondsLeft, setSecondsLeft] = useState(OFFER_SECONDS);
  const deadlineRef = useRef(Date.now() + OFFER_SECONDS * 1000);
  const declinedRef = useRef(false);

  useEffect(() => {
    deadlineRef.current = Date.now() + OFFER_SECONDS * 1000;
    setSecondsLeft(OFFER_SECONDS);
    declinedRef.current = false;
    playPingSound();
    const beepInterval = setInterval(playPingSound, 3000);
    const tick = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0 && !declinedRef.current) {
        declinedRef.current = true;
        clearInterval(tick);
        clearInterval(beepInterval);
        onDecline(offer, "expired");
      }
    }, 250);
    return () => {
      clearInterval(tick);
      clearInterval(beepInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer.id]);

  const pct = (secondsLeft / OFFER_SECONDS) * 100;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(20,20,20,.55)",
         display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: "24px 24px 0 0",
           padding: "22px 20px calc(22px + env(safe-area-inset-bottom))", boxShadow: SHADOW.lg }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
          <Bell size={18} color={C.orange} />
          <span style={{ fontSize: 15, fontWeight: 700 }}>Nova corrida!</span>
          <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: C.orange }}>{secondsLeft}s</span>
        </div>
        <div style={{ height: 4, background: C.surface, borderRadius: RADIUS.pill, overflow: "hidden", marginBottom: 18 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: C.orange, transition: "width .25s linear" }} />
        </div>

        <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
          <Store size={15} color={C.grayText} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>{order.restaurants?.name}</span>
        </div>
        <div className="flex items-start gap-2" style={{ marginBottom: 16 }}>
          <MapPin size={14} color={C.grayText} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 13.5, color: C.grayText, lineHeight: 1.5 }}>
            {order.restaurants?.address || "—"} <br /> → {order.address}
          </span>
        </div>

        <div className="flex items-center justify-between" style={{ background: C.surface, borderRadius: RADIUS.lg, padding: "12px 16px", marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: C.grayText }}>
            {(order.order_items || []).length} item{(order.order_items || []).length === 1 ? "" : "s"} · pedido {formatBRL(order.total)}
          </span>
          <span className="flex items-center gap-1" style={{ fontSize: 18, fontWeight: 700, color: C.ok }}>
            <Wallet size={16} /> {formatBRL(order.delivery_fee ?? 0)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button disabled={working} onClick={() => { declinedRef.current = true; onDecline(offer, "declined"); }}
            className="flex items-center justify-center gap-1"
            style={{ flex: 1, background: "#fff", color: "#B42318", border: "1.5px solid #B42318", borderRadius: RADIUS.md,
                     cursor: working ? "default" : "pointer", padding: "14px 0", fontFamily: FONT, fontSize: 14.5, fontWeight: 700 }}>
            <X size={16} /> Recusar
          </button>
          <button disabled={working} onClick={() => { declinedRef.current = true; onAccept(offer); }}
            className="flex items-center justify-center gap-1"
            style={{ flex: 1.4, background: C.orange, color: "#fff", border: "none", borderRadius: RADIUS.md,
                     cursor: working ? "default" : "pointer", padding: "14px 0", fontFamily: FONT, fontSize: 14.5, fontWeight: 700 }}>
            <CheckCircle2 size={16} /> Aceitar corrida
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("inicio");
  const [workingId, setWorkingId] = useState(null);
  const [offerWorking, setOfferWorking] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const coordsRef = useRef({ lat: null, lng: null });

  const driverQuery = useQuery({ queryKey: ["driver", "self", user?.id], queryFn: () => fetchDriverByUser(user.id), enabled: !!user });
  const driver = driverQuery.data;

  const availableQuery = useQuery({ queryKey: ["driver", "available"], queryFn: fetchAvailableDeliveries, enabled: !!driver });
  const mineQuery = useQuery({ queryKey: ["driver", "mine", driver?.id], queryFn: () => fetchDriverOrders(driver.id), enabled: !!driver });
  const offerQuery = useQuery({
    queryKey: ["driver", "offer", driver?.id], queryFn: () => fetchMyActiveOffer(driver.id),
    enabled: !!driver, refetchInterval: OFFER_POLL_MS,
  });
  useOrdersRealtime(["driver", "available"]);
  useOrdersRealtime(["driver", "mine", driver?.id]);

  const available = availableQuery.data || [];
  const mine = mineQuery.data || [];
  const activeOffer = offerQuery.data || null;

  // enquanto disponível, mantém a localização atual num ref (sem re-renderizar a cada
  // atualização) — ela só é lida quando uma tentativa de travar oferta é disparada
  useEffect(() => {
    if (!driver?.available || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        coordsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocationDenied(false);
      },
      () => setLocationDenied(true),
      { enableHighAccuracy: false, maximumAge: 15000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [driver?.available]);

  // heartbeat que força reavaliar a fila periodicamente — sem isso, se essa tentativa
  // de travar uma corrida perder a corrida pra outro entregador, nada mais dispara
  // uma nova tentativa até algo mudar (novo pedido, nova recusa, etc.)
  const [pollTick, setPollTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPollTick((n) => n + 1), OFFER_POLL_MS);
    return () => clearInterval(t);
  }, []);

  // fica de olho nas corridas disponíveis e, se estiver livre pra receber uma, tenta
  // travar o oferecimento da mais antiga — o banco decide quem ganha (mais perto do
  // restaurante entre os disponíveis), então isso é só "levantar a mão" periodicamente
  useEffect(() => {
    if (!driver?.available || activeOffer || available.length === 0) return;
    let cancelled = false;
    const { lat, lng } = coordsRef.current;
    tryClaimOffer(driver.id, lat, lng).then((offer) => {
      if (cancelled || !offer) return;
      queryClient.invalidateQueries({ queryKey: ["driver", "offer", driver.id] });
    }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver?.available, driver?.id, activeOffer, available.map((o) => o.id).join(","), pollTick]);
  const inProgress = mine.filter((o) => o.status === "preparing" || o.status === "out_for_delivery");
  const delivered = mine.filter((o) => o.status === "delivered");

  const today = new Date().toDateString();
  const deliveredToday = delivered.filter((o) => new Date(o.created_at).toDateString() === today);
  const earningsToday = deliveredToday.reduce((sum, o) => sum + Number(o.delivery_fee || 0), 0);
  const earningsTotal = delivered.reduce((sum, o) => sum + Number(o.delivery_fee || 0), 0);

  if (authLoading) return <SkeletonPage />;
  if (!user) return <Navigate to="/entregador/entrar" replace />;
  if (driverQuery.isLoading) return <SkeletonPage />;
  if (!driver) return <Navigate to="/entregador/cadastro" replace />;

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  async function handleToggleAvailable() {
    const next = !driver.available;
    try {
      await updateDriver(driver.id, { available: next });
      queryClient.setQueryData(["driver", "self", user.id], (prev) => ({ ...prev, available: next }));
      showToast(next ? "Você está disponível pra receber corridas." : "Você ficou indisponível.");
    } catch {
      showToast("Não foi possível atualizar agora.");
    }
  }

  async function handleAcceptOffer(offer) {
    setOfferWorking(true);
    try {
      const claimed = await claimDelivery(offer.order_id, driver.id);
      // se o SQL que libera o status "accepted" ainda não rodou, não deixa isso
      // travar a aceitação — a corrida já foi assumida via claimDelivery de qualquer jeito
      await respondToOffer(offer.id, "accepted").catch(() => {});
      showToast(claimed ? `Corrida de ${offer.orders.restaurants?.name} aceita!` : "Essa corrida não está mais disponível.");
      queryClient.setQueryData(["driver", "offer", driver.id], null);
      queryClient.invalidateQueries({ queryKey: ["driver", "available"] });
      queryClient.invalidateQueries({ queryKey: ["driver", "mine", driver.id] });
    } catch {
      showToast("Não foi possível aceitar agora.");
    } finally {
      setOfferWorking(false);
    }
  }

  async function handleDeclineOffer(offer, status) {
    setOfferWorking(true);
    try {
      await respondToOffer(offer.id, status);
      // o banco já marca esse pedido como recusado/expirado pra esse entregador
      // (a próxima tentativa de travar oferta ignora ele automaticamente); só
      // precisa limpar a oferta ativa daqui pra liberar a tentativa seguinte
      queryClient.setQueryData(["driver", "offer", driver.id], null);
      if (status === "declined") showToast("Corrida recusada.");
    } catch {
      showToast("Não foi possível recusar agora.");
    } finally {
      setOfferWorking(false);
    }
  }

  async function handleAdvance(order, nextStatus) {
    setWorkingId(order.id);
    try {
      await updateOrderStatus(order.id, nextStatus);
      queryClient.setQueryData(["driver", "mine", driver.id], (prev) =>
        (prev || []).map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o)));
      showToast(nextStatus === "out_for_delivery" ? "Marcado como retirado." : "Entrega concluída!");
    } catch {
      showToast("Não foi possível atualizar agora.");
    } finally {
      setWorkingId(null);
    }
  }

  const VehicleIcon = VEHICLE_ICONS[driver.vehicle_type] || Bike;

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black }}>
      <div className="vp-portal-shell">
        <aside className="vp-portal-sidebar">
          <div className="flex items-center gap-3">
            <div style={{ width: 40, height: 40, borderRadius: RADIUS.md, background: C.orange, display: "grid", placeItems: "center", flexShrink: 0 }}>
              <VehicleIcon size={19} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{driver.full_name}</div>
              <div style={{ fontSize: 12, color: C.grayText }}>{VEHICLE_LABELS[driver.vehicle_type] || "Moto"}{driver.plate ? ` · ${driver.plate}` : ""}</div>
            </div>
          </div>

          <button onClick={handleToggleAvailable} className="flex items-center gap-2"
            style={{ background: driver.available ? "rgba(46,158,91,.1)" : "rgba(180,35,24,.08)",
                     border: `1px solid ${driver.available ? C.ok : "#B42318"}`, borderRadius: RADIUS.md,
                     padding: "10px 12px", cursor: "pointer", textAlign: "left", width: "100%" }}>
            {driver.available ? <CheckCircle2 size={17} color={C.ok} style={{ flexShrink: 0 }} /> : <PauseCircle size={17} color="#B42318" style={{ flexShrink: 0 }} />}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: driver.available ? C.ok : "#B42318" }}>
                {driver.available ? "Disponível" : "Indisponível"}
              </div>
              <div style={{ fontSize: 11, color: C.grayText }}>Clique pra {driver.available ? "pausar" : "voltar a receber corridas"}</div>
            </div>
          </button>

          {driver.available && locationDenied && (
            <div style={{ fontSize: 11.5, color: "#B42318", background: "#FDECEC", borderRadius: RADIUS.sm, padding: "8px 10px" }}>
              Ative a localização do navegador pra receber corridas mais perto de você primeiro.
            </div>
          )}

          <nav className="vp-portal-nav">
            {NAV_ITEMS.map((item) => {
              const ItemIcon = item.icon;
              const active = activeSection === item.key;
              return (
                <button key={item.key} onClick={() => setActiveSection(item.key)} className="flex items-center gap-2"
                  style={{ background: active ? C.black : "none", color: active ? "#fff" : C.grayText,
                           border: "none", borderRadius: RADIUS.sm, cursor: "pointer", padding: "10px 14px",
                           fontFamily: FONT, fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap" }}>
                  <ItemIcon size={16} /> {item.label}
                </button>
              );
            })}
          </nav>

          <div className="vp-portal-bottom" style={{ marginTop: "auto", flexDirection: "column", gap: 10, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
            <button onClick={handleSignOut} className="flex items-center gap-2"
              style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: RADIUS.sm, cursor: "pointer",
                       padding: "9px 12px", fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.black, justifyContent: "center" }}>
              <LogOut size={14} /> Sair
            </button>
          </div>
        </aside>

        <main className="vp-portal-main">
          <div style={{ maxWidth: 720 }}>
            {activeSection === "inicio" && (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Início</h1>
                <div className="vp-dash-stats" style={{ marginBottom: 28 }}>
                  <StatTile icon={Package} label="Corridas hoje" value={deliveredToday.length} />
                  <StatTile icon={TrendingUp} label="Ganho hoje" value={formatBRL(earningsToday)} accent />
                  <StatTile icon={Clock3} label="Em andamento" value={inProgress.length} />
                </div>

                {!driver.available && (
                  <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: RADIUS.md, padding: "12px 14px", fontSize: 13.5, fontWeight: 600, marginBottom: 24 }}>
                    Você está indisponível — novas corridas não aparecem aqui até você voltar a ficar disponível.
                  </div>
                )}

                {inProgress.length > 0 && (
                  <>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Suas corridas em andamento</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                      {inProgress.map((o) => (
                        <DeliveryCard key={o.id} order={o} action={
                          <button disabled={workingId === o.id}
                            onClick={() => handleAdvance(o, o.status === "preparing" ? "out_for_delivery" : "delivered")}
                            className="flex items-center gap-1"
                            style={{ marginTop: 10, background: C.black, color: "#fff", border: "none", borderRadius: RADIUS.xs,
                                     cursor: workingId === o.id ? "default" : "pointer", padding: "8px 14px", fontFamily: FONT,
                                     fontSize: 12.5, fontWeight: 600, opacity: workingId === o.id ? .6 : 1, width: "100%", justifyContent: "center" }}>
                            {o.status === "preparing" ? "Marquei que peguei o pedido" : "Marquei que entreguei"} <ChevronRight size={13} />
                          </button>
                        } />
                      ))}
                    </div>
                  </>
                )}

                <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Corridas na fila</h2>
                <p style={{ fontSize: 12.5, color: C.grayText, margin: "0 0 12px" }}>
                  Elas pingam pra você automaticamente, uma de cada vez — não precisa clicar aqui.
                </p>
                {available.length === 0 ? (
                  <div style={{ background: C.surface, borderRadius: RADIUS.lg, padding: 24, textAlign: "center" }}>
                    <Package size={26} color={C.gray} style={{ margin: "0 auto 10px" }} />
                    <p style={{ color: C.grayText, fontSize: 14, margin: 0 }}>Nenhuma corrida disponível no momento.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {available.map((o) => (
                      <DeliveryCard key={o.id} order={o} />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeSection === "historico" && (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Histórico</h1>
                <div className="vp-dash-stats" style={{ marginBottom: 24 }}>
                  <StatTile icon={Package} label="Entregas concluídas" value={delivered.length} />
                  <StatTile icon={Wallet} label="Ganho total" value={formatBRL(earningsTotal)} accent />
                </div>
                {delivered.length === 0 ? (
                  <p style={{ color: C.grayText, fontSize: 14 }}>Nenhuma entrega concluída ainda.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {delivered.map((o) => (
                      <div key={o.id} className="flex items-center justify-between" style={{ padding: 14, background: "#fff",
                           border: `1px solid ${C.line}`, borderLeft: `4px solid ${C.ok}`, borderRadius: RADIUS.lg, gap: 8, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{o.restaurants?.name}</div>
                          <div style={{ fontSize: 12, color: C.grayText, marginTop: 2 }}>{new Date(o.created_at).toLocaleString("pt-BR")}</div>
                        </div>
                        <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ok }}>{formatBRL(o.delivery_fee ?? 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeSection === "conta" && (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Conta</h1>
                <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.xl, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div><strong>Nome:</strong> {driver.full_name}</div>
                  <div><strong>Veículo:</strong> {VEHICLE_LABELS[driver.vehicle_type] || "Moto"}</div>
                  {driver.plate && <div><strong>Placa:</strong> {driver.plate}</div>}
                  <div><strong>Telefone:</strong> {driver.phone || "—"}</div>
                  <div><strong>Endereço:</strong> {driver.address || "—"}</div>
                  <div><strong>E-mail:</strong> {user.email}</div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {activeOffer && (
        <RideOfferModal offer={activeOffer} onAccept={handleAcceptOffer} onDecline={handleDeclineOffer} working={offerWorking} />
      )}
    </div>
  );
}
