import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Store, Phone, MapPin, Clock, Bike, Truck, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { C, FONT, slugify, formatBRL, RADIUS } from "../theme";
import { ICONS } from "../data/icons";
import { useAuth } from "../context/AuthContext";
import { createRestaurant, slugExists, fetchRestaurantByOwner } from "../data/queries";
import LocateButton from "../components/LocateButton";
import StepProgress from "../components/StepProgress";
import Header from "../components/Header";

const ICON_OPTIONS = [
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

const STEPS = ["Sobre o restaurante", "Endereço", "Entrega", "Plano", "Revisar e concluir"];

const PLAN_OPTIONS = [
  {
    key: "basico",
    icon: Store,
    title: "Básico",
    desc: "A entrega é feita pelo próprio restaurante (você ou um entregador seu).",
  },
  {
    key: "entrega",
    icon: Truck,
    title: "Entrega",
    desc: "O Vem Provar cuida da entrega pra você, usando entregadores cadastrados na plataforma.",
  },
];

const fieldStyle = {
  border: `1.5px solid ${C.line}`, outline: "none", borderRadius: RADIUS.md, padding: "0 14px",
  minHeight: 54, fontFamily: FONT, fontSize: 15, background: "#fff", width: "100%",
};
const rowStyle = { display: "flex", alignItems: "center", gap: 8, background: "#fff",
  border: `1.5px solid ${C.line}`, borderRadius: RADIUS.md, padding: "0 14px", minHeight: 54 };
const inputInRow = { border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 15, background: "transparent" };

export default function RestaurantSignUp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [iconKey, setIconKey] = useState("store");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  useEffect(() => {
    if (!user) {
      setCheckingExisting(false);
      return;
    }
    let cancelled = false;
    fetchRestaurantByOwner(user.id).then((existing) => {
      if (cancelled) return;
      if (existing) {
        navigate("/painel-restaurante", { replace: true });
      } else {
        setCheckingExisting(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  function handleLocated({ latitude, longitude, address: found }) {
    setCoords({ latitude, longitude });
    if (found) setAddress(found);
  }

  if (user && checkingExisting) {
    return (
      <div style={{ fontFamily: FONT, minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <p style={{ color: C.grayText }}>Carregando…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ fontFamily: FONT, background: C.white, minHeight: "100vh" }}>
        <Header />
        <section className="vp-wrap" style={{ padding: "60px 24px", textAlign: "center", maxWidth: 420 }}>
          <Store size={40} color={C.orange} style={{ margin: "0 auto 16px" }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 10px" }}>Cadastre seu restaurante</h1>
          <p style={{ color: C.grayText, fontSize: 15, marginBottom: 24 }}>
            Antes de cadastrar seu restaurante, você precisa ter uma conta.
          </p>
          <Link to="/criar-conta" style={{ display: "inline-block", background: C.orange, color: "#fff",
               textDecoration: "none", fontSize: 15, fontWeight: 600, padding: "13px 28px", borderRadius: RADIUS.md }}>
            Criar conta
          </Link>
          <p style={{ marginTop: 16, fontSize: 14 }}>
            Já tem conta? <Link to="/entrar" style={{ color: C.orange, fontWeight: 600, textDecoration: "none" }}>Entrar</Link>
          </p>
        </section>
      </div>
    );
  }

  const canAdvance =
    (step === 0 && name.trim()) ||
    (step === 1 && address.trim()) ||
    step === 2 ||
    (step === 3 && !!plan) ||
    step === 4;

  function goNext() {
    if (canAdvance) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      let slug = slugify(name);
      if (!slug) slug = "restaurante";
      if (await slugExists(slug)) {
        slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      }
      const restaurant = await createRestaurant({
        owner_id: user.id,
        slug,
        name,
        category: category || "Restaurante",
        icon_key: iconKey,
        color_variant: Math.floor(Math.random() * 5),
        phone,
        address,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        delivery_fee: deliveryFee ? Number(deliveryFee) : 0,
        delivery_time: deliveryTime || "30-50",
        plan,
      });
      navigate("/painel-restaurante", { state: { justCreated: true, restaurantId: restaurant.id } });
    } catch (err) {
      setError("Não foi possível cadastrar o restaurante. Tente novamente.");
      setLoading(false);
    }
  }

  const iconLabel = ICON_OPTIONS.find((o) => o.key === iconKey)?.label || "Outro";

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <section className="vp-wrap" style={{ padding: "40px 24px 120px", maxWidth: 480 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>Cadastre seu restaurante</h1>
        <p style={{ color: C.grayText, fontSize: 14.5, marginBottom: 24 }}>
          Leva menos de 2 minutos. Depois você já pode adicionar o cardápio.
        </p>

        <StepProgress steps={STEPS} current={step} />

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 260 }}>
          {step === 0 && (
            <>
              <div style={rowStyle}>
                <Store size={18} color={C.orange} />
                <input required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do restaurante" style={inputInRow} />
              </div>
              <input value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder="Categoria (ex: Pizza · Italiana)" style={fieldStyle} />
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.grayText, display: "block", marginBottom: 6 }}>
                  Categoria (é como seu restaurante aparece na busca por categorias)
                </label>
                <select value={iconKey} onChange={(e) => setIconKey(e.target.value)} style={fieldStyle}>
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div style={rowStyle}>
                <Phone size={18} color={C.orange} />
                <input value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="Telefone / WhatsApp" style={inputInRow} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div style={rowStyle}>
                <MapPin size={18} color={C.orange} />
                <input required value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="Endereço do restaurante" style={inputInRow} />
              </div>
              <LocateButton onLocated={handleLocated} />
            </>
          )}

          {step === 2 && (
            <div className="flex" style={{ gap: 12 }}>
              <div style={{ ...rowStyle, flex: 1 }}>
                <Bike size={18} color={C.orange} />
                <input type="number" min="0" step="0.01" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)}
                  placeholder="Taxa de entrega (R$)" style={inputInRow} />
              </div>
              <div style={{ ...rowStyle, flex: 1 }}>
                <Clock size={18} color={C.orange} />
                <input value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)}
                  placeholder="Tempo (ex: 30-40)" style={inputInRow} />
              </div>
            </div>
          )}

          {step === 3 && (
            <>
              <p style={{ fontSize: 13.5, color: C.grayText, margin: "-6px 0 4px" }}>
                Os valores e comissões de cada plano ainda estão sendo definidos — por enquanto é só pra guardar sua preferência.
              </p>
              {PLAN_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = plan === opt.key;
                return (
                  <button key={opt.key} type="button" onClick={() => setPlan(opt.key)}
                    style={{ display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left",
                             background: active ? "rgba(238,108,26,.08)" : "#fff",
                             border: `1.5px solid ${active ? C.orange : C.line}`, borderRadius: RADIUS.lg,
                             padding: "16px 18px", cursor: "pointer" }}>
                    <Icon size={22} color={active ? C.orange : C.grayText} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{opt.title}</div>
                      <div style={{ fontSize: 13.5, color: C.grayText, marginTop: 2 }}>{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {step === 4 && (
            <div style={{ background: C.surface, borderRadius: RADIUS.lg, padding: 18 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                <CheckCircle2 size={18} color={C.ok} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Confira os dados antes de concluir</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
                <div><strong>Nome:</strong> {name || "—"}</div>
                <div><strong>Categoria:</strong> {category || "Restaurante"}</div>
                <div><strong>Tipo:</strong> {iconLabel}</div>
                <div><strong>Telefone:</strong> {phone || "—"}</div>
                <div><strong>Endereço:</strong> {address || "—"}</div>
                <div><strong>Taxa de entrega:</strong> {deliveryFee ? formatBRL(Number(deliveryFee)) : "Grátis"}</div>
                <div><strong>Tempo estimado:</strong> {deliveryTime || "30-50"} min</div>
                <div><strong>Plano:</strong> {PLAN_OPTIONS.find((o) => o.key === plan)?.title || "—"}</div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: RADIUS.md, padding: 12, fontSize: 13.5, marginTop: 16 }}>
            {error}
          </div>
        )}

        <div className="flex items-center justify-between" style={{ marginTop: 24 }}>
          {step > 0 ? (
            <button type="button" onClick={goBack} className="flex items-center gap-1"
              style={{ background: "none", border: "none", cursor: "pointer", color: C.grayText,
                       fontSize: 14, fontWeight: 600, padding: "10px 4px" }}>
              <ArrowLeft size={16} /> Voltar
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} disabled={!canAdvance} className="flex items-center gap-2"
              style={{ background: canAdvance ? C.orange : C.gray, color: "#fff", border: "none",
                       cursor: canAdvance ? "pointer" : "default", borderRadius: RADIUS.md, padding: "13px 26px",
                       fontFamily: FONT, fontSize: 15, fontWeight: 600 }}>
              Continuar <ArrowRight size={17} />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading}
              style={{ background: loading ? C.gray : C.orange, color: "#fff", border: "none",
                       cursor: loading ? "default" : "pointer", borderRadius: RADIUS.md, padding: "13px 26px",
                       fontFamily: FONT, fontSize: 15, fontWeight: 600 }}>
              {loading ? "Cadastrando…" : "Concluir cadastro"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
