import { useEffect, useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { User, Phone, MapPin, Mail, Heart, Bike, Store, LogOut, ChevronRight, MapPinned } from "lucide-react";
import { C, FONT } from "../theme";
import { useAuth } from "../context/AuthContext";
import { fetchProfile, updateProfile } from "../data/queries";
import LocateButton from "../components/LocateButton";
import Header from "../components/Header";
import { SkeletonPage } from "../components/Skeleton";

function LoadingScreen() {
  return <SkeletonPage />;
}

function AccountLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-3" style={{ background: "#fff", border: `1.5px solid ${C.line}`,
         borderRadius: 12, padding: "14px", textDecoration: "none", color: C.black }}>
      <Icon size={18} color={C.orange} />
      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>{label}</span>
      <ChevronRight size={16} color={C.grayText} />
    </Link>
  );
}

export default function MyData() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then((p) => {
      setFullName(p?.full_name || "");
      setPhone(p?.phone || "");
      setAddress(p?.address || "");
      if (p?.latitude != null) setCoords({ latitude: p.latitude, longitude: p.longitude });
      setLoadingProfile(false);
    });
  }, [user]);

  if (authLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/entrar" replace />;
  if (loadingProfile) return <LoadingScreen />;

  function handleLocated({ latitude, longitude, address: found }) {
    setCoords({ latitude, longitude });
    if (found) setAddress(found);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile(user.id, {
        full_name: fullName,
        phone,
        address,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <section className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: 480 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Meus dados</h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.grayText, marginBottom: 6 }}>Nome completo</div>
            <div className="flex items-center gap-2" style={{ background: "#fff", border: `1.5px solid ${C.line}`,
                 borderRadius: 12, padding: "0 14px", minHeight: 54 }}>
              <User size={18} color={C.orange} />
              <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 15, background: "transparent" }} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.grayText, marginBottom: 6 }}>Telefone</div>
            <div className="flex items-center gap-2" style={{ background: "#fff", border: `1.5px solid ${C.line}`,
                 borderRadius: 12, padding: "0 14px", minHeight: 54 }}>
              <Phone size={18} color={C.orange} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 90000-0000"
                style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 15, background: "transparent" }} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.grayText, marginBottom: 6 }}>Endereço</div>
            <div className="flex items-center gap-2" style={{ background: "#fff", border: `1.5px solid ${C.line}`,
                 borderRadius: 12, padding: "0 14px", minHeight: 54, marginBottom: 8 }}>
              <MapPin size={18} color={C.orange} />
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro"
                style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 15, background: "transparent" }} />
            </div>
            <LocateButton onLocated={handleLocated} />
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.grayText, marginBottom: 6 }}>E-mail e senha</div>
            <div className="flex items-center gap-2" style={{ background: C.surface, borderRadius: 12, padding: "0 14px", minHeight: 54 }}>
              <Mail size={18} color={C.grayText} />
              <span style={{ flex: 1, fontSize: 15, color: C.grayText }}>{user.email}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: C.gray }}>Em breve</span>
            </div>
          </div>

          {saved && (
            <div style={{ background: "rgba(46,158,91,.1)", color: C.ok, borderRadius: 12, padding: 12, fontSize: 13.5, fontWeight: 600 }}>
              Dados salvos!
            </div>
          )}

          <button type="submit" disabled={saving}
            style={{ background: saving ? C.gray : C.orange, color: "#fff", border: "none",
                     cursor: saving ? "default" : "pointer", borderRadius: 12, padding: "15px 0",
                     fontFamily: FONT, fontSize: 15.5, fontWeight: 600, marginTop: 6 }}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 28 }}>
          <AccountLink to="/enderecos" icon={MapPinned} label="Meus endereços" />
          <AccountLink to="/favoritos" icon={Heart} label="Favoritos" />
          <AccountLink to="/parceiro/entrar" icon={Store} label="Cadastre seu restaurante" />
          <AccountLink to="/entregador/entrar" icon={Bike} label="Seja entregador" />
          <button onClick={handleSignOut} className="flex items-center gap-3"
            style={{ width: "100%", background: "#fff", border: `1.5px solid ${C.line}`, cursor: "pointer",
                     borderRadius: 12, padding: 14, fontFamily: FONT, textAlign: "left" }}>
            <LogOut size={18} color="#B42318" />
            <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: "#B42318" }}>Sair</span>
          </button>
        </div>
      </section>
    </div>
  );
}
