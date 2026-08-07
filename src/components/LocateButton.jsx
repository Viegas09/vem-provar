import { useState } from "react";
import { LocateFixed, Loader2 } from "lucide-react";
import { C } from "../theme";
import { getCurrentCoords, reverseGeocode } from "../lib/geolocation";

export default function LocateButton({ onLocated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const { latitude, longitude } = await getCurrentCoords();
      const address = await reverseGeocode(latitude, longitude).catch(() => null);
      onLocated({ latitude, longitude, address });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={loading} className="flex items-center gap-1"
        style={{ background: "none", border: "none", cursor: loading ? "default" : "pointer", color: C.orange,
                 fontSize: 13, fontWeight: 600, padding: 0 }}>
        {loading ? <Loader2 size={14} className="vp-spin" /> : <LocateFixed size={14} />}
        {loading ? "Localizando…" : "Usar minha localização"}
      </button>
      {error && <div style={{ color: "#B42318", fontSize: 12.5, marginTop: 4 }}>{error}</div>}
    </div>
  );
}
