import { Link, useLocation, Navigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { C, FONT, formatBRL } from "../theme";
import Header from "../components/Header";
import ConfettiBurst from "../components/ConfettiBurst";

export default function OrderConfirmation() {
  const { state } = useLocation();

  if (!state) return <Navigate to="/" replace />;

  const { orderId, orderNumber, total, payment, scheduledFor } = state;
  const paymentLabel = { pix: "Pix", card: "Cartão na entrega", cash: "Dinheiro" }[payment] || payment;
  const scheduledLabel = scheduledFor
    ? new Date(scheduledFor).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <ConfettiBurst />
      <Header />

      <section className="vp-wrap" style={{ padding: "60px 24px", maxWidth: 480, textAlign: "center" }}>
        <CheckCircle2 size={56} color={C.ok} className="vp-check-in" style={{ margin: "0 auto 18px" }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>Pedido confirmado!</h1>
        <p style={{ fontSize: 15, color: C.grayText, margin: "0 0 28px" }}>
          Pedido #{orderNumber} · {formatBRL(total)} · {paymentLabel}
        </p>
        <div style={{ background: C.surface, borderRadius: 16, padding: "20px 24px", marginBottom: 28 }}>
          <p style={{ fontSize: 14.5, margin: 0, lineHeight: 1.6 }}>
            {scheduledLabel
              ? <>Seu pedido foi agendado para <b>{scheduledLabel}</b>. O restaurante vai começar o preparo perto desse horário.</>
              : "O restaurante já recebeu seu pedido e vai começar o preparo. Tempo estimado de entrega: 30–40 min."}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3" style={{ flexWrap: "wrap" }}>
          {orderId && (
            <Link to={`/pedido/${orderId}`} style={{ display: "inline-block", background: C.orange, color: "#fff", textDecoration: "none",
                 fontSize: 15, fontWeight: 600, padding: "13px 28px", borderRadius: 12 }}>
              Acompanhar pedido
            </Link>
          )}
          <Link to="/" style={{ display: "inline-block", background: "none", border: `1px solid ${C.line}`, color: C.black, textDecoration: "none",
               fontSize: 15, fontWeight: 600, padding: "13px 28px", borderRadius: 12 }}>
            Voltar para o início
          </Link>
        </div>
      </section>
    </div>
  );
}
