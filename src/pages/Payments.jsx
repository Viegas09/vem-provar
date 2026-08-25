import { Navigate } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { C, FONT } from "../theme";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import { SkeletonPage } from "../components/Skeleton";

export default function Payments() {
  const { user, loading } = useAuth();

  if (loading) return <SkeletonPage />;
  if (!user) return <Navigate to="/entrar" replace />;

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <section className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: 480 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Formas de pagamento</h1>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <CreditCard size={40} color={C.gray} style={{ margin: "0 auto 14px" }} />
          <p style={{ color: C.grayText, fontSize: 14.5, margin: "0 0 6px" }}>
            Em breve você vai poder salvar seus cartões aqui.
          </p>
          <p style={{ color: C.grayText, fontSize: 13.5, margin: 0 }}>
            Por enquanto, o pagamento é feito na hora de fechar o pedido (Pix, cartão ou dinheiro).
          </p>
        </div>
      </section>
    </div>
  );
}
