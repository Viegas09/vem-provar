import { useEffect, useRef, useState } from "react";
import { C, FONT, RADIUS } from "../theme";

let sdkPromise = null;
function loadMpSdk() {
  if (window.MercadoPago) return Promise.resolve(window.MercadoPago);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.onload = () => resolve(window.MercadoPago);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

export default function CardPaymentBrick({ orderId, total, onPaid, onCancel }) {
  const containerRef = useRef(null);
  const brickRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [failMsg, setFailMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
    if (!publicKey) {
      setFailMsg("Pagamento com cartão indisponível no momento.");
      setLoading(false);
      return;
    }

    loadMpSdk()
      .then((MercadoPago) => {
        if (cancelled || !containerRef.current) return;
        const mp = new MercadoPago(publicKey, { locale: "pt-BR" });
        mp.bricks()
          .create("cardPayment", "vp-card-brick", {
            initialization: { amount: total },
            callbacks: {
              onReady: () => setLoading(false),
              onSubmit: (formData) =>
                new Promise((resolve, reject) => {
                  fetch("/api/mp-create-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      orderId, origin: window.location.origin, method: "card",
                      cardToken: formData.token, paymentMethodId: formData.payment_method_id,
                      installments: formData.installments,
                      payer: { email: formData.payer?.email, identification: formData.payer?.identification },
                    }),
                  })
                    .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
                    .then(({ ok, data }) => {
                      if (!ok || data.status === "rejected") {
                        setFailMsg("Pagamento recusado. Tente outro cartão.");
                        reject();
                        return;
                      }
                      onPaid?.();
                      resolve();
                    })
                    .catch(() => { setFailMsg("Não foi possível processar o pagamento."); reject(); });
                }),
              onError: (err) => {
                console.error("card brick error", err);
                setFailMsg("Erro no formulário de cartão. Confira os dados e tente de novo.");
              },
            },
          })
          .then((controller) => { brickRef.current = controller; });
      })
      .catch(() => { setFailMsg("Não foi possível carregar o pagamento com cartão."); setLoading(false); });

    return () => {
      cancelled = true;
      brickRef.current?.unmount?.();
    };
  }, [orderId, total]);

  return (
    <div className="vp-fade-in" style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.xl, padding: 16 }}>
      {loading && <p style={{ fontSize: 13.5, color: C.grayText, textAlign: "center", margin: "20px 0" }}>Carregando pagamento…</p>}
      {failMsg && <div style={{ color: "#B42318", fontSize: 13, marginBottom: 10, textAlign: "center" }}>{failMsg}</div>}
      <div id="vp-card-brick" ref={containerRef} />
      <button type="button" onClick={onCancel}
        style={{ width: "100%", background: "none", border: "none", color: C.grayText, fontFamily: FONT,
                 fontSize: 13, fontWeight: 600, marginTop: 10, cursor: "pointer" }}>
        Voltar
      </button>
    </div>
  );
}
