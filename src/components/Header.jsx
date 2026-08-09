import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { C } from "../theme";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import WORDMARK_DARK from "../assets/wordmark-dark.png";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(250,250,247,.92)",
                     backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}` }}>
      <div className="vp-wrap" style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <img src={WORDMARK_DARK} alt="Vem Provar" style={{ height: 44, width: "auto", display: "block" }} draggable={false} />
        </Link>

        <nav className="vp-navlinks">
          <a href="#entregador" style={{ color: C.black, textDecoration: "none", fontSize: 14.5, fontWeight: 500 }}>Seja entregador</a>
          <Link to="/cadastro-restaurante" style={{ color: C.black, textDecoration: "none", fontSize: 14.5, fontWeight: 500 }}>Cadastre seu restaurante</Link>
          <span style={{ width: 1, height: 22, background: C.line }} />
          <Link to="/carrinho" className="flex items-center gap-1" style={{ position: "relative", color: C.black, textDecoration: "none" }}>
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span style={{ position: "absolute", top: -8, right: -10, background: C.orange, color: "#fff",
                             fontSize: 11, fontWeight: 700, borderRadius: 999, minWidth: 18, height: 18,
                             display: "grid", placeItems: "center", padding: "0 4px" }}>
                {totalItems}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <span className="flex items-center gap-1" style={{ color: C.black, fontSize: 14.5, fontWeight: 500 }}>
                <User size={16} /> {user.user_metadata?.full_name?.split(" ")[0] || "Você"}
              </span>
              <button onClick={handleSignOut}
                style={{ background: "none", border: `1px solid ${C.line}`, color: C.black, textDecoration: "none",
                         fontSize: 13.5, fontWeight: 600, padding: "9px 16px", borderRadius: 10, cursor: "pointer" }}>
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/criar-conta" style={{ color: C.orange, textDecoration: "none", fontSize: 14.5, fontWeight: 600 }}>Criar conta</Link>
              <Link to="/entrar" style={{ background: C.orange, color: "#fff", textDecoration: "none",
                   fontSize: 14.5, fontWeight: 600, padding: "10px 22px", borderRadius: 10 }}>Entrar</Link>
            </>
          )}
        </nav>

        <div className="vp-mobilebtn-row">
          <Link to="/carrinho" style={{ position: "relative", color: C.black, display: "grid", placeItems: "center",
                width: 42, height: 42, borderRadius: 10, border: `1px solid ${C.line}`, background: "#fff" }}>
            <ShoppingCart size={19} />
            {totalItems > 0 && (
              <span style={{ position: "absolute", top: -6, right: -6, background: C.orange, color: "#fff",
                             fontSize: 10, fontWeight: 700, borderRadius: 999, minWidth: 16, height: 16,
                             display: "grid", placeItems: "center", padding: "0 3px" }}>
                {totalItems}
              </span>
            )}
          </Link>
          <button className="vp-mobilebtn" onClick={() => setMenuOpen(!menuOpen)}
            style={{ width: 42, height: 42, borderRadius: 10, border: `1px solid ${C.line}`, background: "#fff",
                     placeItems: "center", cursor: "pointer" }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="vp-wrap" style={{ paddingBottom: 16, display: "flex", flexDirection: "column", gap: 4 }}>
          <a href="#entregador" onClick={() => setMenuOpen(false)} style={{ padding: "11px 4px", color: C.black, textDecoration: "none", fontSize: 15, fontWeight: 500, borderBottom: `1px solid ${C.line}` }}>Seja entregador</a>
          <Link to="/cadastro-restaurante" onClick={() => setMenuOpen(false)} style={{ padding: "11px 4px", color: C.black, textDecoration: "none", fontSize: 15, fontWeight: 500, borderBottom: `1px solid ${C.line}` }}>Cadastre seu restaurante</Link>
          {user ? (
            <>
              <div style={{ padding: "11px 4px", color: C.black, fontSize: 15, fontWeight: 500, borderBottom: `1px solid ${C.line}` }}>
                Olá, {user.user_metadata?.full_name?.split(" ")[0] || "você"}
              </div>
              <button onClick={() => { setMenuOpen(false); handleSignOut(); }}
                style={{ marginTop: 8, background: "none", border: `1px solid ${C.line}`, color: C.black, textAlign: "center",
                         fontSize: 15, fontWeight: 600, padding: "12px 0", borderRadius: 10, cursor: "pointer" }}>
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/criar-conta" onClick={() => setMenuOpen(false)} style={{ padding: "11px 4px", color: C.black, textDecoration: "none", fontSize: 15, fontWeight: 500, borderBottom: `1px solid ${C.line}` }}>Criar conta</Link>
              <Link to="/entrar" onClick={() => setMenuOpen(false)} style={{ marginTop: 8, background: C.orange, color: "#fff", textAlign: "center",
                   textDecoration: "none", fontSize: 15, fontWeight: 600, padding: "12px 0", borderRadius: 10 }}>Entrar</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
