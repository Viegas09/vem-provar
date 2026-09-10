import { AtSign, Smartphone } from "lucide-react";
import { C } from "../theme";
import WORDMARK_LIGHT from "../assets/wordmark-light.png";

const COLUMNS = [
  { h: "Pedir", items: ["Restaurantes", "Categorias", "Cupons"] },
  { h: "Parceiros", items: ["Cadastre seu restaurante", "Seja entregador"] },
  { h: "Ajuda", items: ["Central de ajuda", "Fale com a gente"] },
];

export default function Footer() {
  return (
    <footer style={{ background: C.black, borderTop: `1px solid rgba(255,255,255,.08)` }}>
      <div className="vp-wrap" style={{ padding: "40px 24px 48px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 28 }}>
        <div style={{ maxWidth: 300 }}>
          <div style={{ marginBottom: 12 }}>
            <img src={WORDMARK_LIGHT} alt="Vem Provar" style={{ height: 38, width: "auto", display: "block" }} draggable={false} />
          </div>
          <p style={{ color: C.gray, fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>
            O maior portal de gastronomia de Itapecerica da Serra. Descubra. Prove. Compartilhe.
          </p>
          <a href="#" className="flex items-center gap-2" style={{ marginTop: 16, color: C.orange, textDecoration: "none", fontSize: 13.5, fontWeight: 600 }}>
            <AtSign size={16} /> vemprovaritap
          </a>
        </div>
        <div className="flex" style={{ gap: 56, flexWrap: "wrap" }}>
          {COLUMNS.map((col) => (
            <div key={col.h}>
              <div style={{ color: C.white, fontSize: 13, fontWeight: 700, marginBottom: 12, letterSpacing: .3 }}>{col.h}</div>
              {col.items.map((it) => (
                <a key={it} href="#" style={{ display: "block", color: C.gray, textDecoration: "none", fontSize: 13.5, padding: "5px 0" }}>{it}</a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="vp-wrap" style={{ padding: "16px 24px", borderTop: `1px solid rgba(255,255,255,.08)`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <span style={{ color: "rgba(184,178,166,.7)", fontSize: 12.5 }}>© 2026 Vem Provar · Itapecerica da Serra</span>
        <span className="flex items-center gap-1" style={{ color: "rgba(184,178,166,.7)", fontSize: 12.5 }}>
          <Smartphone size={13} /> Instale o app pelo navegador
        </span>
      </div>
    </footer>
  );
}
