import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { XCircle, Package } from "lucide-react";
import { C, FONT, formatBRL } from "../theme";
import { fetchOrderById } from "../data/queries";
import Header from "../components/Header";
import StepProgress from "../components/StepProgress";
import { SkeletonPage } from "../components/Skeleton";

const STEPS = ["Pedido recebido", "Em preparo", "Saiu para entrega", "Entregue"];
const STATUS_INDEX = { pending: 0, preparing: 1, out_for_delivery: 2, delivered: 3 };
const POLL_MS = 6000;

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchOrderById(id);
        if (cancelled) return;
        if (data) setOrder(data);
        else setNotFound(true);
      } catch {
        // mantém a última versão carregada; tenta de novo no próximo poll
      }
    }

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  if (notFound) {
    return (
      <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
        <Header />
        <section className="vp-wrap" style={{ padding: "60px 24px", maxWidth: 480, textAlign: "center" }}>
          <Package size={48} color={C.grayText} style={{ margin: "0 auto 16px" }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Pedido não encontrado</h1>
          <p style={{ fontSize: 14.5, color: C.grayText }}>Confira se o link do pedido está correto.</p>
          <Link to="/" style={{ display: "inline-block", marginTop: 20, color: C.orange, textDecoration: "none", fontWeight: 600 }}>
            Voltar para o início
          </Link>
        </section>
      </div>
    );
  }

  if (!order) {
    return <SkeletonPage />;
  }

  const cancelled = order.status === "cancelled";
  const current = STATUS_INDEX[order.status] ?? 0;

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <section className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: 560 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Pedido #{order.id.slice(0, 8)}</h1>
        <p style={{ fontSize: 14, color: C.grayText, margin: "0 0 24px" }}>
          {order.restaurants?.name} · {new Date(order.created_at).toLocaleString("pt-BR")}
        </p>

        {cancelled ? (
          <div className="flex items-center gap-2" style={{ background: "#FDECEC", color: "#B42318", borderRadius: 14, padding: 18, marginBottom: 28 }}>
            <XCircle size={20} />
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>Esse pedido foi cancelado.</span>
          </div>
        ) : (
          <div key={order.status} className="vp-fade-in" style={{ background: C.surface, borderRadius: 16, padding: "22px 20px", marginBottom: 28 }}>
            <StepProgress steps={STEPS} current={current} />
          </div>
        )}

        <div style={{ border: `1px solid ${C.line}`, borderRadius: 16, padding: "18px 20px", marginBottom: 20 }}>
          <h2 style={{ fontSize: 14.5, fontWeight: 700, margin: "0 0 10px" }}>Endereço de entrega</h2>
          <p style={{ fontSize: 14, color: C.grayText, margin: 0 }}>{order.address}</p>
        </div>

        <div style={{ border: `1px solid ${C.line}`, borderRadius: 16, padding: "18px 20px" }}>
          <h2 style={{ fontSize: 14.5, fontWeight: 700, margin: "0 0 10px" }}>Itens</h2>
          {(order.order_items || []).map((item) => (
            <div key={item.id} style={{ marginBottom: 8 }}>
              <div className="flex items-center justify-between" style={{ fontSize: 14 }}>
                <span>{item.qty}x {item.name}</span>
                <span style={{ color: C.grayText }}>{formatBRL(item.price * item.qty)}</span>
              </div>
              {item.complements && item.complements.length > 0 && (
                <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 2 }}>
                  + {item.complements.map((c) => c.name).join(", ")}
                </div>
              )}
              {item.notes && (
                <div style={{ fontSize: 12.5, color: C.grayText, fontStyle: "italic", marginTop: 2 }}>Obs: {item.notes}</div>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between" style={{ borderTop: `1px solid ${C.line}`, marginTop: 10, paddingTop: 10, fontSize: 15.5, fontWeight: 700 }}>
            <span>Total</span>
            <span>{formatBRL(order.total)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
