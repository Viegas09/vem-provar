import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bike, Car, Phone, MapPin, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { C, FONT, RADIUS } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { createDriver, fetchDriverByUser } from "../../data/queries";
import LocateButton from "../../components/LocateButton";
import StepProgress from "../../components/StepProgress";
import PortalHeader from "../../components/PortalHeader";
import { SkeletonPage } from "../../components/Skeleton";

const VEHICLE_OPTIONS = [
  { key: "moto", label: "Moto", icon: Bike },
  { key: "bike", label: "Bicicleta", icon: Bike },
  { key: "carro", label: "Carro", icon: Car },
];

const STEPS = ["Veículo", "Endereço", "Revisar e concluir"];

const rowStyle = { display: "flex", alignItems: "center", gap: 8, background: "#fff",
  border: `1.5px solid ${C.line}`, borderRadius: RADIUS.md, padding: "0 14px", minHeight: 54 };
const inputInRow = { border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 15, background: "transparent" };
const fieldStyle = { border: `1.5px solid ${C.line}`, outline: "none", borderRadius: RADIUS.md, padding: "0 14px",
  minHeight: 54, fontFamily: FONT, fontSize: 15, background: "#fff", width: "100%" };

export default function DriverOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [vehicleType, setVehicleType] = useState("moto");
  const [plate, setPlate] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  useEffect(() => {
    if (!user) {
      setCheckingExisting(false);
      return;
    }
    let cancelled = false;
    fetchDriverByUser(user.id).then((existing) => {
      if (cancelled) return;
      if (existing) {
        navigate("/entregador/painel", { replace: true });
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

  if (authLoading || (user && checkingExisting)) {
    return (
      <SkeletonPage />
    );
  }

  if (!user) {
    return (
      <div style={{ fontFamily: FONT, background: C.white, minHeight: "100vh" }}>
        <PortalHeader label="Portal do Entregador" />
        <section className="vp-wrap" style={{ padding: "60px 24px", textAlign: "center", maxWidth: 420 }}>
          <Bike size={40} color={C.orange} style={{ margin: "0 auto 16px" }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 10px" }}>Seja um entregador</h1>
          <p style={{ color: C.grayText, fontSize: 15, marginBottom: 24 }}>
            Antes de continuar, você precisa ter uma conta de entregador.
          </p>
          <Link to="/entregador/criar-conta" style={{ display: "inline-block", background: C.orange, color: "#fff",
               textDecoration: "none", fontSize: 15, fontWeight: 600, padding: "13px 28px", borderRadius: RADIUS.md }}>
            Criar conta de entregador
          </Link>
          <p style={{ marginTop: 16, fontSize: 14 }}>
            Já tem conta? <Link to="/entregador/entrar" style={{ color: C.orange, fontWeight: 600, textDecoration: "none" }}>Entrar</Link>
          </p>
        </section>
      </div>
    );
  }

  const canAdvance = step === 0 || (step === 1 && address.trim()) || step === 2;

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
      await createDriver({
        user_id: user.id,
        full_name: user.user_metadata?.full_name || "Entregador",
        phone,
        vehicle_type: vehicleType,
        plate,
        address,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      });
      navigate("/entregador/painel");
    } catch (err) {
      setError("Não foi possível concluir o cadastro. Tente novamente.");
      setLoading(false);
    }
  }

  const vehicleLabel = VEHICLE_OPTIONS.find((o) => o.key === vehicleType)?.label || "Moto";

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <PortalHeader label="Portal do Entregador" />
      <section className="vp-wrap" style={{ padding: "40px 24px 120px", maxWidth: 480 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>Complete seu cadastro</h1>
        <p style={{ color: C.grayText, fontSize: 14.5, marginBottom: 24 }}>
          Leva menos de 1 minuto. Depois você já pode começar a receber corridas.
        </p>

        <StepProgress steps={STEPS} current={step} />

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 220 }}>
          {step === 0 && (
            <>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.grayText, display: "block", marginBottom: 8 }}>
                  Como você vai fazer as entregas?
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {VEHICLE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const active = vehicleType === opt.key;
                    return (
                      <button key={opt.key} type="button" onClick={() => setVehicleType(opt.key)}
                        className="flex items-center gap-3"
                        style={{ background: active ? "rgba(238,108,26,.08)" : "#fff",
                                 border: `1.5px solid ${active ? C.orange : C.line}`, borderRadius: RADIUS.md,
                                 padding: "14px 16px", cursor: "pointer", textAlign: "left" }}>
                        <Icon size={19} color={active ? C.orange : C.grayText} />
                        <span style={{ fontSize: 14.5, fontWeight: active ? 600 : 500 }}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {vehicleType !== "bike" && (
                <input value={plate} onChange={(e) => setPlate(e.target.value)}
                  placeholder="Placa do veículo" style={fieldStyle} />
              )}
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
                  placeholder="Seu endereço" style={inputInRow} />
              </div>
              <LocateButton onLocated={handleLocated} />
            </>
          )}

          {step === 2 && (
            <div style={{ background: C.surface, borderRadius: RADIUS.lg, padding: 18 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                <CheckCircle2 size={18} color={C.ok} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Confira os dados antes de concluir</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
                <div><strong>Veículo:</strong> {vehicleLabel}</div>
                {plate && <div><strong>Placa:</strong> {plate}</div>}
                <div><strong>Telefone:</strong> {phone || "—"}</div>
                <div><strong>Endereço:</strong> {address || "—"}</div>
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
