import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Bell, BellOff, CheckCircle2 } from "lucide-react";
import { C, FONT } from "../theme";
import { useAuth } from "../context/AuthContext";
import { subscribeToPush } from "../lib/push";
import Header from "../components/Header";
import { SkeletonPage } from "../components/Skeleton";

export default function Settings() {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState("checking");
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkStatus();
  }, [user]);

  async function checkStatus() {
    if (!("Notification" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    if (Notification.permission !== "granted") {
      setStatus("off");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setStatus(subscription ? "on" : "off");
    } catch {
      setStatus("off");
    }
  }

  async function handleEnable() {
    setEnabling(true);
    await subscribeToPush(user.id);
    await checkStatus();
    setEnabling(false);
  }

  if (loading) return <SkeletonPage />;
  if (!user) return <Navigate to="/entrar" replace />;

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <section className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: 480 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Configurações</h1>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.grayText, textTransform: "uppercase", letterSpacing: .3, marginBottom: 10 }}>
          Notificações
        </div>

        <div style={{ background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
          {status === "on" && (
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} color={C.ok} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>Notificações ativadas</div>
                <div style={{ fontSize: 13, color: C.grayText, marginTop: 2 }}>
                  Você vai receber avisos de pedido mesmo com o app fechado.
                </div>
              </div>
            </div>
          )}

          {status === "off" && (
            <div className="flex items-center gap-3">
              <Bell size={20} color={C.orange} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>Notificações desativadas</div>
                <div style={{ fontSize: 13, color: C.grayText, marginTop: 2, marginBottom: 12 }}>
                  Ative pra saber na hora quando seu pedido for aceito, sair pra entrega ou chegar.
                </div>
                <button onClick={handleEnable} disabled={enabling}
                  style={{ background: enabling ? C.gray : C.orange, color: "#fff", border: "none", borderRadius: 10,
                           cursor: enabling ? "default" : "pointer", padding: "10px 18px", fontFamily: FONT,
                           fontSize: 13.5, fontWeight: 600 }}>
                  {enabling ? "Ativando…" : "Ativar notificações"}
                </button>
              </div>
            </div>
          )}

          {status === "denied" && (
            <div className="flex items-center gap-3">
              <BellOff size={20} color={C.grayText} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>Notificações bloqueadas</div>
                <div style={{ fontSize: 13, color: C.grayText, marginTop: 2 }}>
                  Você bloqueou as notificações pelo navegador. Pra ativar de novo, vá nas configurações do site/app no seu celular ou navegador.
                </div>
              </div>
            </div>
          )}

          {status === "unsupported" && (
            <div className="flex items-center gap-3">
              <BellOff size={20} color={C.grayText} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13.5, color: C.grayText }}>
                Seu navegador não suporta notificações push.
              </div>
            </div>
          )}

          {status === "checking" && (
            <div style={{ fontSize: 13.5, color: C.grayText }}>Verificando…</div>
          )}
        </div>
      </section>
    </div>
  );
}
