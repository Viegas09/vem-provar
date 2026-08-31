import { Link } from "react-router-dom";
import { Pizza, Sandwich, Coffee, Fish, Heart, X } from "lucide-react";
import { C, FONT, RADIUS, SHADOW } from "../theme";
import WORDMARK_ONORANGE from "../assets/wordmark-onorange.png";

const FLOAT_ICONS = [
  { Icon: Pizza, top: "10%", right: "8%", size: 30 },
  { Icon: Fish, top: "26%", right: "18%", size: 24 },
  { Icon: Sandwich, top: "82%", right: "12%", size: 28 },
  { Icon: Coffee, top: "68%", right: "22%", size: 22 },
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div style={{ fontFamily: FONT, minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr", position: "relative" }} className="vp-auth-grid">
      <Link to="/" aria-label="Fechar" title="Voltar para a home"
        style={{ position: "fixed", top: 18, right: 18, zIndex: 40, width: 38, height: 38, borderRadius: RADIUS.pill,
                 background: "#fff", border: `1px solid ${C.line}`, display: "grid", placeItems: "center",
                 boxShadow: SHADOW.xs }}>
        <X size={18} color={C.black} />
      </Link>
      <div style={{ background: `linear-gradient(160deg, ${C.orange}, ${C.orangeDark})`, position: "relative",
                   overflow: "hidden", padding: "40px 40px", display: "flex", flexDirection: "column",
                   justifyContent: "space-between", minHeight: 260 }}>
        <Link to="/">
          <img src={WORDMARK_ONORANGE} alt="Vem Provar" style={{ height: 48, width: "auto" }} draggable={false} />
        </Link>

        <div className="vp-auth-icons">
          {FLOAT_ICONS.map(({ Icon, top, right, size }, i) => (
            <Icon key={i} size={size} color="rgba(255,255,255,.3)"
              style={{ position: "absolute", top, right }} />
          ))}
        </div>

        <div style={{ position: "relative", maxWidth: 380 }}>
          <Heart size={34} color="#fff" fill="#fff" style={{ marginBottom: 14, opacity: 0.9 }} />
          <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 700, lineHeight: 1.15, margin: 0, letterSpacing: -0.5 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ color: "rgba(255,255,255,.85)", fontSize: 15, marginTop: 12, lineHeight: 1.5 }}>
              {subtitle}
            </p>
          )}
        </div>
        <div />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px", background: C.white }}>
        <div style={{ width: "100%", maxWidth: 380 }}>{children}</div>
      </div>

      <style>{`
        .vp-auth-icons { display: none; }
        @media (min-width: 860px) {
          .vp-auth-grid { grid-template-columns: 1fr 1fr !important; }
          .vp-auth-grid > div:first-child { min-height: 100vh !important; }
          .vp-auth-icons { display: block; }
        }
      `}</style>
    </div>
  );
}
