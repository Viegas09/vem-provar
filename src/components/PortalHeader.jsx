import { Link, useNavigate } from "react-router-dom";
import { C, RADIUS } from "../theme";
import { useAuth } from "../context/AuthContext";
import WORDMARK_DARK from "../assets/wordmark-dark.png";

export default function PortalHeader({ label, homeTo = "/" }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate(homeTo);
  }

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(250,250,247,.92)",
                     backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}` }}>
      <div className="vp-wrap flex items-center justify-between" style={{ height: 72 }}>
        <Link to={homeTo} className="flex items-center gap-2" style={{ textDecoration: "none" }}>
          <img src={WORDMARK_DARK} alt="Vem Provar" style={{ height: 40, width: "auto", display: "block" }} draggable={false} />
          {label && (
            <span style={{ color: C.grayText, fontSize: 13, fontWeight: 600, borderLeft: `1px solid ${C.line}`, paddingLeft: 12 }}>
              {label}
            </span>
          )}
        </Link>
        {user && (
          <button onClick={handleSignOut}
            style={{ background: "none", border: `1px solid ${C.line}`, color: C.black,
                     fontSize: 13.5, fontWeight: 600, padding: "9px 16px", borderRadius: RADIUS.sm, cursor: "pointer" }}>
            Sair
          </button>
        )}
      </div>
    </header>
  );
}
