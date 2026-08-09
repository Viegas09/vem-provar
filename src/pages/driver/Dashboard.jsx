import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Bike, Car, Package } from "lucide-react";
import { C, FONT } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { fetchDriverByUser } from "../../data/queries";
import PortalHeader from "../../components/PortalHeader";

const VEHICLE_LABELS = { moto: "Moto", bike: "Bicicleta", carro: "Carro" };
const VEHICLE_ICONS = { moto: Bike, bike: Bike, carro: Car };

export default function DriverDashboard() {
  const { user } = useAuth();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDriverByUser(user.id).then((d) => {
      setDriver(d);
      setLoading(false);
    });
  }, [user]);

  if (!user) return <Navigate to="/entregador/entrar" replace />;

  if (loading) {
    return (
      <div style={{ fontFamily: FONT, minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <p style={{ color: C.grayText }}>Carregando…</p>
      </div>
    );
  }

  if (!driver) return <Navigate to="/entregador/cadastro" replace />;

  const VehicleIcon = VEHICLE_ICONS[driver.vehicle_type] || Bike;

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <PortalHeader label="Portal do Entregador" />
      <section className="vp-wrap" style={{ padding: "32px 24px 120px", maxWidth: 640 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: C.orange, display: "grid", placeItems: "center" }}>
            <VehicleIcon size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{driver.full_name}</h1>
            <div style={{ fontSize: 13.5, color: C.grayText }}>
              {VEHICLE_LABELS[driver.vehicle_type] || "Moto"}{driver.plate ? ` · ${driver.plate}` : ""}
            </div>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: C.grayText, marginBottom: 32 }}>{driver.address}</p>

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Entregas disponíveis</h2>
        <div style={{ background: C.surface, borderRadius: 14, padding: 24, textAlign: "center" }}>
          <Package size={28} color={C.gray} style={{ margin: "0 auto 10px" }} />
          <p style={{ color: C.grayText, fontSize: 14, margin: 0 }}>
            Nenhuma entrega disponível no momento. Essa parte ainda está sendo construída —
            em breve você vai poder aceitar corridas por aqui.
          </p>
        </div>
      </section>
    </div>
  );
}
