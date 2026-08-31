import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart, User, MapPin, Search, ChevronDown,
  Package, Heart, Settings, LogOut,
} from "lucide-react";
import { C, FONT, RADIUS, SHADOW } from "../theme";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useUserLocation } from "../hooks/useUserLocation";
import LocateButton from "./LocateButton";
import NotificationBell from "./NotificationBell";
import WORDMARK_DARK from "../assets/wordmark-dark.png";

export default function Header() {
  const [addressOpen, setAddressOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const [location, setLocation] = useUserLocation();
  const navigate = useNavigate();

  async function handleSignOut() {
    setProfileOpen(false);
    await signOut();
    navigate("/");
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    navigate(searchTerm.trim() ? `/?q=${encodeURIComponent(searchTerm.trim())}` : "/");
  }

  function handleLocated({ latitude, longitude, address }) {
    setLocation({ address: address || location.address, latitude, longitude });
  }

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Você";

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(250,250,247,.92)",
                     backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}`,
                     paddingTop: "env(safe-area-inset-top)" }}>
      <div className="vp-wrap vp-headerrow" style={{ height: 72, display: "flex", alignItems: "center", gap: 18 }}>
        <Link to="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <img src={WORDMARK_DARK} alt="Vem Provar" style={{ height: 44, width: "auto", display: "block" }} draggable={false} />
        </Link>

        <div style={{ position: "relative", flexShrink: 0 }} className="vp-addresschip">
          <button onClick={() => { setAddressOpen((v) => !v); setProfileOpen(false); }} className="flex items-center gap-1"
            style={{ background: "none", border: "none", cursor: "pointer", color: C.black, fontFamily: FONT,
                     fontSize: 13.5, fontWeight: 600, padding: "8px 4px", maxWidth: 180 }}>
            <MapPin size={16} color={C.orange} style={{ flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {location.address || "Definir localização"}
            </span>
            <ChevronDown size={14} style={{ flexShrink: 0 }} />
          </button>
          {addressOpen && (
            <>
              <div onClick={() => setAddressOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 39 }} />
              <div className="vp-dropdown-in" style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 40, width: 300,
                   background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.lg, padding: 16,
                   boxShadow: SHADOW.md }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Seu endereço de entrega</div>
                <input value={location.address} onChange={(e) => setLocation({ ...location, address: e.target.value })}
                  placeholder="Digite seu endereço"
                  style={{ width: "100%", border: `1.5px solid ${C.line}`, outline: "none", borderRadius: RADIUS.sm,
                           padding: "10px 12px", fontFamily: FONT, fontSize: 14, marginBottom: 10 }} />
                <div className="flex items-center justify-between">
                  <LocateButton onLocated={handleLocated} />
                  <button onClick={() => setAddressOpen(false)}
                    style={{ background: C.orange, color: "#fff", border: "none", cursor: "pointer", borderRadius: RADIUS.xs,
                             padding: "7px 14px", fontFamily: FONT, fontSize: 13, fontWeight: 600 }}>
                    Salvar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="vp-searchform" style={{ flex: 1, maxWidth: 380 }}>
          <div className="flex items-center gap-2" style={{ background: "#fff", border: `1.5px solid ${C.line}`,
               borderRadius: RADIUS.sm, padding: "0 12px", height: 42 }}>
            <Search size={16} color={C.grayText} />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Busque por item ou loja"
              style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 13.5, background: "transparent" }} />
          </div>
        </form>

        <nav className="vp-navlinks" style={{ marginLeft: "auto" }}>
          <Link to="/entregador/entrar" style={{ color: C.black, textDecoration: "none", fontSize: 14.5, fontWeight: 500 }}>Seja entregador</Link>
          <Link to="/parceiro/entrar" style={{ color: C.black, textDecoration: "none", fontSize: 14.5, fontWeight: 500 }}>Cadastre seu restaurante</Link>
          <span style={{ width: 1, height: 22, background: C.line }} />
          {user && <NotificationBell variant="plain" />}
          <Link to="/carrinho" aria-label={totalItems > 0 ? `Carrinho, ${totalItems} itens` : "Carrinho"} className="flex items-center gap-1" style={{ position: "relative", color: C.black, textDecoration: "none" }}>
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span key={totalItems} className="vp-pop" style={{ position: "absolute", top: -8, right: -10, background: C.orange, color: "#fff",
                             fontSize: 11, fontWeight: 700, borderRadius: RADIUS.pill, minWidth: 18, height: 18,
                             display: "grid", placeItems: "center", padding: "0 4px" }}>
                {totalItems}
              </span>
            )}
          </Link>
          {user ? (
            <div style={{ position: "relative" }}>
              <button onClick={() => { setProfileOpen((v) => !v); setAddressOpen(false); }} className="flex items-center gap-1"
                style={{ background: "none", border: `1px solid ${C.line}`, cursor: "pointer", color: C.black,
                         fontSize: 13.5, fontWeight: 600, padding: "8px 12px", borderRadius: RADIUS.sm }}>
                <User size={15} /> {firstName} <ChevronDown size={13} />
              </button>
              {profileOpen && (
                <>
                  <div onClick={() => setProfileOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 39 }} />
                  <div className="vp-dropdown-in" style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 40, width: 200,
                       background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.lg, padding: 8,
                       boxShadow: SHADOW.md }}>
                    <ProfileMenuItem to="/meus-pedidos" icon={Package} label="Pedidos" onClick={() => setProfileOpen(false)} />
                    <ProfileMenuItem to="/favoritos" icon={Heart} label="Favoritos" onClick={() => setProfileOpen(false)} />
                    <ProfileMenuItem to="/perfil" icon={Settings} label="Perfil" onClick={() => setProfileOpen(false)} />
                    <div style={{ height: 1, background: C.line, margin: "6px 4px" }} />
                    <button onClick={handleSignOut} className="flex items-center gap-2"
                      style={{ width: "100%", background: "none", border: "none", cursor: "pointer", color: "#B42318",
                               fontFamily: FONT, fontSize: 13.5, fontWeight: 600, padding: "9px 10px", borderRadius: RADIUS.xs,
                               textAlign: "left" }}>
                      <LogOut size={15} /> Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link to="/criar-conta" style={{ color: C.orange, textDecoration: "none", fontSize: 14.5, fontWeight: 600 }}>Criar conta</Link>
              <Link to="/entrar" style={{ background: C.orange, color: "#fff", textDecoration: "none",
                   fontSize: 14.5, fontWeight: 600, padding: "10px 22px", borderRadius: RADIUS.sm }}>Entrar</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function ProfileMenuItem({ to, icon: Icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2"
      style={{ color: C.black, textDecoration: "none", fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
               padding: "9px 10px", borderRadius: RADIUS.xs }}>
      <Icon size={15} color={C.grayText} /> {label}
    </Link>
  );
}
