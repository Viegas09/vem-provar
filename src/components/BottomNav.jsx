import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Package, Search, ShoppingCart, User } from "lucide-react";
import { C, FONT } from "../theme";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useAppMode } from "../hooks/useAppMode";

export default function BottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();
  const { user } = useAuth();
  const isAppMode = useAppMode();

  useEffect(() => {
    document.body.classList.add("vp-has-bottomnav");
    if (isAppMode) document.body.classList.add("vp-force-bottomnav");
    return () => {
      document.body.classList.remove("vp-has-bottomnav");
      document.body.classList.remove("vp-force-bottomnav");
    };
  }, [isAppMode]);
  const profileTo = user ? "/perfil" : "/entrar";
  const path = location.pathname;

  const tabs = [
    { to: "/", icon: Home, label: "Início", active: path === "/" },
    { to: "/busca", icon: Search, label: "Busca", active: path.startsWith("/busca") },
    { to: "/carrinho", icon: ShoppingCart, label: "Carrinho", active: path.startsWith("/carrinho") || path.startsWith("/checkout"), badge: totalItems },
    { to: "/meus-pedidos", icon: Package, label: "Pedidos", active: path.startsWith("/meus-pedidos") || path.startsWith("/pedido") },
    { to: profileTo, icon: User, label: "Perfil", active: ["/perfil", "/meus-dados", "/entrar", "/criar-conta", "/favoritos", "/enderecos", "/pagamentos", "/configuracoes", "/ajuda"].some((p) => path.startsWith(p)) },
  ];

  return (
    <nav className="vp-bottomnav" style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40,
         background: "rgba(255,255,255,.96)", backdropFilter: "blur(8px)", borderTop: `1px solid ${C.line}`, fontFamily: FONT,
         display: isAppMode ? "flex" : undefined }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link key={tab.label} to={tab.to} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
               gap: 2, padding: "8px 0 calc(14px + env(safe-area-inset-bottom))", textDecoration: "none",
               color: tab.active ? C.orange : C.grayText }}>
            <div style={{ position: "relative" }}>
              <Icon size={22} strokeWidth={tab.active ? 2.4 : 2} fill={tab.active && tab.label === "Início" ? "rgba(238,108,26,.12)" : "none"} />
              {!!tab.badge && (
                <span style={{ position: "absolute", top: -4, right: -8, background: C.orange, color: "#fff", fontSize: 9,
                     fontWeight: 700, borderRadius: 999, minWidth: 14, height: 14, display: "grid", placeItems: "center", padding: "0 3px" }}>
                  {tab.badge}
                </span>
              )}
            </div>
            <span style={{ fontSize: 10.5, fontWeight: tab.active ? 700 : 500 }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
