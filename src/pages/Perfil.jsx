import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { User, MapPinned, Heart, CreditCard, Settings, HelpCircle, LogOut, ChevronRight, Store, Bike } from "lucide-react";
import { C, FONT, RADIUS, formatBRL } from "../theme";
import { useAuth } from "../context/AuthContext";
import { fetchOrdersForCustomer } from "../data/queries";
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
  const [spending, setSpending] = useState(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchOrdersForCustomer(user.id).then((orders) => {
      if (!active) return;
      const delivered = orders.filter((o) => o.status === "delivered");
      const now = new Date();
      const monthOrders = delivered.filter((o) => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      setSpending({
        monthTotal: monthOrders.reduce((s, o) => s + Number(o.total), 0),
        monthCount: monthOrders.length,
        allTimeTotal: delivered.reduce((s, o) => s + Number(o.total), 0),
        allTimeCount: delivered.length,
      });
    }).catch(() => {});
    return () => { active = false; };
  }, [user]);

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
          <div style={{ width: 56, height: 56, borderRadius: RADIUS.pill, background: C.orange, color: "#fff",
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

        {spending && spending.allTimeCount > 0 && (
          <div className="flex items-center" style={{ background: C.surface, borderRadius: RADIUS.xl, padding: "16px 20px", marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 19, fontWeight: 700 }}>{formatBRL(spending.monthTotal)}</div>
              <div style={{ fontSize: 12, color: C.grayText, marginTop: 1 }}>
                Este mês · {spending.monthCount} pedido{spending.monthCount === 1 ? "" : "s"}
              </div>
            </div>
            <div style={{ width: 1, height: 32, background: C.line, margin: "0 16px" }} />
            <div style={{ flex: 1, textAlign: "right" }}>
              <div style={{ fontSize: 19, fontWeight: 700 }}>{formatBRL(spending.allTimeTotal)}</div>
              <div style={{ fontSize: 12, color: C.grayText, marginTop: 1 }}>
                No total · {spending.allTimeCount} pedido{spending.allTimeCount === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        )}

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
          <SectionLink to="/parceiro" icon={Store} label="Cadastre seu restaurante" />
          <SectionLink to="/entregador" icon={Bike} label="Seja entregador" />
        </div>

        <button onClick={handleSignOut} className="flex items-center gap-3"
          style={{ width: "100%", background: "#fff", border: `1.5px solid ${C.line}`, cursor: "pointer",
                   borderRadius: RADIUS.md, padding: 14, fontFamily: FONT, textAlign: "left" }}>
          <LogOut size={18} color="#B42318" />
          <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: "#B42318" }}>Sair</span>
        </button>
      </section>
    </div>
  );
}
