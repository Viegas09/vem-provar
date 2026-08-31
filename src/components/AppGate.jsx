import { Link } from "react-router-dom";
import { C, FONT, RADIUS } from "../theme";
import WORDMARK_DARK from "../assets/wordmark-dark.png";
import LOGO_MARK_HEART from "../assets/logo-mark-heart.png";

export default function AppGate() {
  return (
    <div style={{ fontFamily: FONT, minHeight: "100vh", background: C.white, display: "flex",
         flexDirection: "column" }}>
      <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 24px 0" }}>
        <img src={WORDMARK_DARK} alt="Vem Provar" style={{ height: 30, width: "auto" }} draggable={false} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
           justifyContent: "center", padding: "24px 28px", textAlign: "center" }}>
        <img src={LOGO_MARK_HEART} alt="" width={104} height={104} style={{ display: "block", marginBottom: 26 }}
          draggable={false} />
        <h1 style={{ fontSize: 25, fontWeight: 700, lineHeight: 1.25, margin: "0 0 10px", maxWidth: 320 }}>
          Bem-vindo(a) ao Vem Provar!
        </h1>
        <p style={{ fontSize: 14.5, color: C.grayText, lineHeight: 1.6, margin: 0, maxWidth: 320 }}>
          Crie sua conta ou faça login para pedir dos melhores restaurantes de Itapecerica da Serra.
        </p>
      </div>

      <div style={{ padding: "0 24px calc(28px + env(safe-area-inset-bottom))", display: "flex",
           flexDirection: "column", gap: 14, alignItems: "center" }}>
        <Link to="/criar-conta" style={{ background: C.orange, color: "#fff", textDecoration: "none",
             borderRadius: RADIUS.md, padding: "16px 0", fontSize: 15.5, fontWeight: 600, textAlign: "center",
             width: "100%", maxWidth: 340 }}>
          Criar conta
        </Link>
        <Link to="/entrar" style={{ color: C.black, textDecoration: "none", fontSize: 14.5, fontWeight: 600,
             textAlign: "center" }}>
          Já tenho conta · Entrar
        </Link>
      </div>
    </div>
  );
}
