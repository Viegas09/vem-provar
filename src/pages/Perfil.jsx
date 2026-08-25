import { Link, Navigate, useNavigate } from "react-router-dom";
import { User, MapPinned, Heart, CreditCard, Settings, HelpCircle, LogOut, ChevronRight, Store, Bike } from "lucide-react";
import { C, FONT } from "../theme";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import { SkeletonPage } from "../components/Skeleton";

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.grayText, textTransform: "uppercase", letterSpacing: .3,
         margin: "0 4px 8px" }}>
      {children}
    </div>
  );
}

function SectionLink({ to, icon: Icon, label, sub }) {
  return (
    <Link to={to} className="flex items-center gap-3" style={{ padding: "13px 4px", textDecoration: "none",
         color: C.black, borderBottom: `1px solid ${C.line}` }}>
      <Icon size={19} color={C.orange} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: C.grayText, marginTop: 1 }}>{sub}</div>}
      </div>
      <ChevronRight size={16} color={C.grayText} style={{ flexShrink: 0 }} />
    </Link>
  );
}

export default function Perfil() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) return <SkeletonPage />;
  if (!user) return <Navigate to="/entrar" replace />;

  const fullName = user.user_metadata?.full_name || "Você";
  const firstName = fullName.split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <section className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: 480 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: C.orange, color: "#fff",
               display: "grid", placeItems: "center", fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{fullName}</div>
            <div style={{ fontSize: 13, color: C.grayText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <SectionTitle>Conta</SectionTitle>
          <SectionLink to="/meus-dados" icon={User} label="Meus dados" sub="Nome, telefone, e-mail" />
          <SectionLink to="/enderecos" icon={MapPinned} label="Meus endereços" />
          <SectionLink to="/favoritos" icon={Heart} label="Favoritos" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <SectionTitle>Pagamentos</SectionTitle>
          <SectionLink to="/pagamentos" icon={CreditCard} label="Formas de pagamento" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <SectionTitle>Configurações</SectionTitle>
          <SectionLink to="/configuracoes" icon={Settings} label="Notificações e preferências" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <SectionTitle>Ajuda</SectionTitle>
          <SectionLink to="/ajuda" icon={HelpCircle} label="Central de ajuda" />
        </div>

        <div style={{ marginBottom: 28 }}>
          <SectionTitle>Parceiros</SectionTitle>
          <SectionLink to="/parceiro/entrar" icon={Store} label="Cadastre seu restaurante" />
          <SectionLink to="/entregador/entrar" icon={Bike} label="Seja entregador" />
        </div>

        <button onClick={handleSignOut} className="flex items-center gap-3"
          style={{ width: "100%", background: "#fff", border: `1.5px solid ${C.line}`, cursor: "pointer",
                   borderRadius: 12, padding: 14, fontFamily: FONT, textAlign: "left" }}>
          <LogOut size={18} color="#B42318" />
          <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: "#B42318" }}>Sair</span>
        </button>
      </section>
    </div>
  );
}
