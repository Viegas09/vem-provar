import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RADIUS } from "../theme";

const VEHICLE_EMOJI = { moto: "🛵", bike: "🚲", carro: "🚗" };

function pin(bg, symbol, size = 34) {
  return L.divIcon({
    className: "vp-map-pin",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};display:grid;place-items:center;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(20,20,20,.3);font-size:${size * 0.5}px;line-height:1;">${symbol}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const RESTAURANT_ICON = pin("#141414", "🏪");
const CUSTOMER_ICON = pin("#EE6C1A", "🏠");

// mapa ao vivo com a posição do entregador — pedido pra restaurante enquanto
// não retirou, restaurante pro cliente depois; sem API de rota (linha reta
// mesmo), só pra dar noção de direção e distância.
//
// Leaflet puro (sem react-leaflet): mais simples de manter em sincronia com
// posições que mudam via polling, e evita um bug real de build encontrado
// aqui — o bundler (rolldown, ainda experimental nessa versão do Vite)
// descartava silenciosamente o react-leaflet inteiro do build de produção
// (funcionava perfeito em dev, sumia sem erro nenhum só no build final).
export default function DeliveryMap({ restaurant, destination, driver, headingToRestaurant }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const lineRef = useRef(null);

  // sempre monta o mapa (o pai já só renderiza esse componente quando faz
  // sentido) centrado no que já for conhecido — restaurante/destino são
  // fixos e quase sempre já disponíveis; a posição do entregador ainda pode
  // não ter chegado no primeiro poll, e não pode travar o mapa inteiro
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const start = restaurant?.lat != null ? restaurant : destination?.lat != null ? destination : null;
    mapRef.current = L.map(elRef.current, { scrollWheelZoom: false, attributionControl: false, zoomControl: true })
      .setView(start ? [start.lat, start.lng] : [0, 0], start ? 15 : 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap" }).addTo(mapRef.current);
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      // os marcadores/linha pertenciam ao mapa que acabou de ser destruído — sem
      // isso, no StrictMode (que monta/desmonta esse efeito de propósito, uma vez,
      // pra pegar bug como esse), a tentativa seguinte de atualizar posição usava
      // "já existe, só move" num marcador órfão que nunca foi pro mapa novo
      markersRef.current = {};
      lineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const target = headingToRestaurant ? restaurant : destination;
    const points = [];

    if (restaurant?.lat != null) {
      points.push([restaurant.lat, restaurant.lng]);
      if (!markersRef.current.restaurant) markersRef.current.restaurant = L.marker([restaurant.lat, restaurant.lng], { icon: RESTAURANT_ICON }).addTo(map);
      else markersRef.current.restaurant.setLatLng([restaurant.lat, restaurant.lng]);
    }
    if (destination?.lat != null) {
      points.push([destination.lat, destination.lng]);
      if (!markersRef.current.destination) markersRef.current.destination = L.marker([destination.lat, destination.lng], { icon: CUSTOMER_ICON }).addTo(map);
      else markersRef.current.destination.setLatLng([destination.lat, destination.lng]);
    }
    if (driver?.lat != null) {
      points.push([driver.lat, driver.lng]);
      const icon = pin("#2E9E5B", VEHICLE_EMOJI[driver.vehicle_type] || "🛵", 38);
      if (!markersRef.current.driver) markersRef.current.driver = L.marker([driver.lat, driver.lng], { icon }).addTo(map);
      else markersRef.current.driver.setLatLng([driver.lat, driver.lng]).setIcon(icon);

      if (target?.lat != null) {
        const line = [[driver.lat, driver.lng], [target.lat, target.lng]];
        if (!lineRef.current) lineRef.current = L.polyline(line, { color: "#EE6C1A", weight: 3, dashArray: "1 8", lineCap: "round" }).addTo(map);
        else lineRef.current.setLatLngs(line);
      }
    }

    if (points.length >= 2) map.fitBounds(points, { padding: [36, 36], maxZoom: 16 });
    else if (points.length === 1) map.setView(points[0], 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.lat, restaurant?.lng, destination?.lat, destination?.lng, driver?.lat, driver?.lng, driver?.vehicle_type, headingToRestaurant]);

  return (
    <div style={{ borderRadius: RADIUS.xl, overflow: "hidden", border: "1px solid rgba(20,20,20,.09)" }}>
      <div ref={elRef} style={{ height: 220, width: "100%" }} />
    </div>
  );
}
