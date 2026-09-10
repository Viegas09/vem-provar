import { Navigate } from "react-router-dom";
import { CreditCard, QrCode, Banknote } from "lucide-react";
import { C, FONT, RADIUS } from "../theme";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import { SkeletonPage } from "../components/Skeleton";

const METHODS = [
  { icon: QrCode, label: "Pix", desc: "Confirmação na hora, direto no checkout" },
  { icon: CreditCard, label: "Cartão", desc: "Crédito ou débito, na hora de fechar o pedido" },
  { icon: Banknote, label: "Dinheiro", desc: "Na entrega ou retirada, quando o restaurante aceita" },
];

export default function Payments() {
  const { user, loading } = useAuth();

  if (loading) return <SkeletonPage />;
  if (!user) return <Navigate to="/entrar" replace />;

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <section className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: 480 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Formas de pagamento</h1>

        <div className="vp-fade-in" style={{ textAlign: "center", padding: "40px 0 32px" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(238,108,26,.08)",
               display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <CreditCard size={30} color={C.orange} />
          </div>
          <p style={{ fontSize: 15.5, fontWeight: 700, margin: "0 0 4px" }}>Cartões salvos chegando em breve</p>
          <p style={{ fontSize: 13.5, color: C.grayText, margin: 0, maxWidth: 320, marginInline: "auto", lineHeight: 1.5 }}>
            Por enquanto, você escolhe como pagar na hora de fechar cada pedido.
          </p>
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.grayText, textTransform: "uppercase", letterSpacing: .3, marginBottom: 10 }}>
          Como você pode pagar hoje
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {METHODS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3" style={{ background: C.surface, borderRadius: RADIUS.md, padding: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: RADIUS.sm, background: "#fff", flexShrink: 0, display: "grid", placeItems: "center" }}>
                <Icon size={18} color={C.orange} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 1 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
