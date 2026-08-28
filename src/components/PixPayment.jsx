import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, QrCode } from "lucide-react";
import { C, FONT, formatBRL } from "../theme";

function onlyDigits(v) { return String(v || "").replace(/\D/g, ""); }

export default function PixPayment({ orderId, total, defaultEmail, onPaid, onCancel }) {
  const [email, setEmail] = useState(defaultEmail || "");
  const [cpf, setCpf] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [payment, setPayment] = useState(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("pending");
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  async function handleCreate(e) {
    e.preventDefault();
    if (onlyDigits(cpf).length !== 11) {
      setError("Digite um CPF válido (11 dígitos).");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/mp-create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId, origin: window.location.origin, method: "pix",
          payerEmail: email, payerDocNumber: onlyDigits(cpf),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.pix?.qrCode) {
        console.error("PixPayment: mp-create-payment failed", res.status, data);
        setError(data.detail || `Não foi possível gerar o Pix agora (${data.error || res.status}). Tente novamente.`);
        setCreating(false);
        return;
      }
      setPayment(data);
      setCreating(false);
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/mp-payment-status?orderId=${orderId}`);
          const d = await r.json();
          if (d.status === "approved") {
            clearInterval(pollRef.current);
            setStatus("approved");
            onPaid?.();
          } else if (d.status === "rejected" || d.status === "cancelled") {
            clearInterval(pollRef.current);
            setStatus(d.status);
          }
        } catch { /* tenta de novo no próximo tick */ }
      }, 3000);
    } catch {
      setError("Não foi possível gerar o Pix agora. Tente novamente.");
      setCreating(false);
    }
  }

  function handleCopy() {
    if (!payment?.pix?.qrCode) return;
    navigator.clipboard?.writeText(payment.pix.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!payment) {
    return (
      <form onSubmit={handleCreate} className="vp-fade-in" style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
          <QrCode size={19} color={C.orange} />
          <span style={{ fontSize: 15, fontWeight: 700 }}>Pagar {formatBRL(total)} com Pix</span>
        </div>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: C.grayText, display: "block", marginBottom: 4 }}>E-mail</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
          style={{ width: "100%", border: `1.5px solid ${C.line}`, borderRadius: 10, padding: "11px 14px",
                   fontFamily: FONT, fontSize: 14.5, marginBottom: 12, outline: "none", boxSizing: "border-box" }} />
        <label style={{ fontSize: 12.5, fontWeight: 600, color: C.grayText, display: "block", marginBottom: 4 }}>CPF (exigido pelo Mercado Pago)</label>
        <input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" required
          style={{ width: "100%", border: `1.5px solid ${C.line}`, borderRadius: 10, padding: "11px 14px",
                   fontFamily: FONT, fontSize: 14.5, marginBottom: 12, outline: "none", boxSizing: "border-box" }} />
        {error && <div style={{ color: "#B42318", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button type="submit" disabled={creating}
          style={{ width: "100%", background: creating ? C.gray : C.orange, color: "#fff", border: "none", borderRadius: 12,
                   padding: "13px 0", fontFamily: FONT, fontSize: 14.5, fontWeight: 600, cursor: creating ? "default" : "pointer" }}>
          {creating ? "Gerando Pix…" : "Gerar QR code"}
        </button>
        <button type="button" onClick={onCancel}
          style={{ width: "100%", background: "none", border: "none", color: C.grayText, fontFamily: FONT,
                   fontSize: 13, fontWeight: 600, marginTop: 10, cursor: "pointer" }}>
          Voltar
        </button>
      </form>
    );
  }

  return (
    <div className="vp-fade-in" style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 20, textAlign: "center" }}>
      <div className="flex items-center justify-center gap-2" style={{ marginBottom: 14 }}>
        {status === "approved" ? <Check size={19} color={C.ok} /> : <Loader2 size={19} color={C.orange} className="vp-spin" />}
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          {status === "approved" ? "Pagamento aprovado!" : status === "rejected" || status === "cancelled" ? "Pagamento não aprovado" : "Aguardando pagamento…"}
        </span>
      </div>
      {status === "pending" && payment.pix?.qrCodeBase64 && (
        <img src={`data:image/png;base64,${payment.pix.qrCodeBase64}`} alt="QR code Pix"
          style={{ width: 220, height: 220, margin: "0 auto 14px", borderRadius: 12, border: `1px solid ${C.line}` }} />
      )}
      {status === "pending" && (
        <>
          <button type="button" onClick={handleCopy} className="flex items-center justify-center gap-2"
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 0",
                     fontFamily: FONT, fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginBottom: 10 }}>
            <Copy size={15} /> {copied ? "Copiado!" : "Copiar código Pix"}
          </button>
          <p style={{ fontSize: 12.5, color: C.grayText, margin: 0 }}>
            Abra o app do seu banco, escolha pagar com Pix Copia e Cola ou escaneie o QR code.
          </p>
        </>
      )}
    </div>
  );
}
