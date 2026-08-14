import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ChevronDown, ShoppingCart } from "lucide-react";
import { C, FONT } from "../theme";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useUserLocation } from "../hooks/useUserLocation";
import LocateButton from "./LocateButton";
import NotificationBell from "./NotificationBell";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function AppHeader() {
  const [addressOpen, setAddressOpen] = useState(false);
  const { totalItems } = useCart();
  const { user } = useAuth();
  const [location, setLocation] = useUserLocation();

  function handleLocated({ latitude, longitude, address }) {
    setLocation({ address: address || location.address, latitude, longitude });
  }

  const firstName = user?.user_metadata?.full_name?.split(" ")[0];

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(250,250,247,.96)",
                     backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.line}`,
                     paddingTop: "env(safe-area-inset-top)" }}>
      <div className="vp-wrap flex items-center justify-between" style={{ height: 66, gap: 14 }}>
        <div style={{ position: "relative", minWidth: 0, flex: 1 }}>
          <button onClick={() => setAddressOpen((v) => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0,
                     display: "block", width: "100%" }}>
            {firstName && (
              <div style={{ fontSize: 12.5, color: C.grayText, fontWeight: 500, marginBottom: 2 }}>
                {greeting()}, {firstName}
              </div>
            )}
            <div className="flex items-center gap-1" style={{ color: C.black, fontFamily: FONT, fontWeight: 700, fontSize: 15 }}>
              <MapPin size={16} color={C.orange} style={{ flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {location.address || "Definir localização"}
              </span>
              <ChevronDown size={14} style={{ flexShrink: 0 }} />
            </div>
          </button>
          {addressOpen && (
            <>
              <div onClick={() => setAddressOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 39 }} />
              <div className="vp-dropdown-in" style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 40,
                   width: 300, maxWidth: "calc(100vw - 48px)", background: "#fff", border: `1px solid ${C.line}`,
                   borderRadius: 14, padding: 16, boxShadow: "0 12px 32px rgba(0,0,0,.14)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Seu endereço de entrega</div>
                <input value={location.address} onChange={(e) => setLocation({ ...location, address: e.target.value })}
                  placeholder="Digite seu endereço"
                  style={{ width: "100%", border: `1.5px solid ${C.line}`, outline: "none", borderRadius: 10,
                           padding: "10px 12px", fontFamily: FONT, fontSize: 14, marginBottom: 10 }} />
                <div className="flex items-center justify-between">
                  <LocateButton onLocated={handleLocated} />
                  <button onClick={() => setAddressOpen(false)}
                    style={{ background: C.orange, color: "#fff", border: "none", cursor: "pointer", borderRadius: 8,
                             padding: "7px 14px", fontFamily: FONT, fontSize: 13, fontWeight: 600 }}>
                    Salvar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center" style={{ gap: 8, flexShrink: 0 }}>
          <NotificationBell />
          <Link to="/carrinho" style={{ position: "relative", color: C.black, display: "grid", placeItems: "center",
                width: 42, height: 42, borderRadius: 10, border: `1px solid ${C.line}`, background: "#fff" }}>
            <ShoppingCart size={19} />
            {totalItems > 0 && (
              <span key={totalItems} className="vp-pop" style={{ position: "absolute", top: -6, right: -6, background: C.orange, color: "#fff",
                             fontSize: 10, fontWeight: 700, borderRadius: 999, minWidth: 16, height: 16,
                             display: "grid", placeItems: "center", padding: "0 3px" }}>
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
