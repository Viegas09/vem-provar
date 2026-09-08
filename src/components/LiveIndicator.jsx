import { useEffect, useState } from "react";
import { C } from "../theme";

// mesmo padrão do acompanhamento de pedido: um pontinho pulsando + "atualizado
// há Xs", pra deixar claro que a tela está viva (os dados já atualizam sozinhos
// via realtime, só faltava um sinal visual disso)
export default function LiveIndicator({ updatedAt, label = "Atualizado" }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const seconds = updatedAt ? Math.max(0, Math.round((Date.now() - updatedAt) / 1000)) : null;
  const text = seconds == null ? "" : seconds < 5 ? "agora mesmo" : seconds < 60 ? `há ${seconds}s` : `há ${Math.round(seconds / 60)} min`;

  return (
    <span className="flex items-center gap-1.5" style={{ fontSize: 12, color: C.grayText, fontWeight: 600, whiteSpace: "nowrap" }}>
      <span className="vp-live-dot" /> {label} {text}
    </span>
  );
}
