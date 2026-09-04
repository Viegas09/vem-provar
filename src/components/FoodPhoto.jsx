import { WARM } from "../theme";

// espaço reservado pra foto de prato/restaurante: se tiver uma foto real
// enviada, mostra ela; senão cai num gradiente com textura + ícone centralizado
// (flutuando) em vez de um bloco de cor liso parado
export default function FoodPhoto({ v = 0, icon: Icon, radius = 16, style, photoUrl, iconSize = 42 }) {
  if (photoUrl) {
    return (
      <div className="vp-photo" style={{ borderRadius: radius, overflow: "hidden", ...style }}>
        <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }
  return (
    <div className="vp-photo vp-food-photo" style={{ position: "relative", background: WARM[v % WARM.length], borderRadius: radius, overflow: "hidden", ...style }}>
      <div className="vp-food-photo-texture" />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 25% 12%, rgba(255,255,255,.3), transparent 60%)" }} />
      {Icon && (
        <div className="vp-food-photo-icon flex items-center justify-center" style={{ position: "absolute", inset: 0 }}>
          <Icon size={iconSize} color="rgba(255,255,255,.55)" strokeWidth={1.4} />
        </div>
      )}
    </div>
  );
}
