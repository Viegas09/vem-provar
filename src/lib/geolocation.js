export function getCurrentCoords() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Seu navegador não suporta geolocalização."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(err.message || "Não foi possível obter sua localização.")),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export async function reverseGeocode(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Não foi possível identificar o endereço.");
  const data = await res.json();
  return data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export async function reverseGeocodeStructured(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Não foi possível identificar o endereço.");
  const data = await res.json();
  const a = data.address || {};
  return {
    street: a.road || a.pedestrian || a.residential || "",
    number: a.house_number || "",
    neighborhood: a.suburb || a.neighbourhood || a.city_district || "",
    city: a.city || a.town || a.village || a.municipality || "",
    cep: a.postcode || "",
  };
}

export async function lookupCep(cep) {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.erro) return null;
  return {
    street: data.logradouro || "",
    neighborhood: data.bairro || "",
    city: data.localidade || "",
  };
}

export function formatAddress({ street, number, neighborhood, city, cep }) {
  const line1 = [street, number].filter(Boolean).join(", ");
  const line2 = [neighborhood, city].filter(Boolean).join(", ");
  const parts = [line1, line2, cep ? `CEP ${cep}` : ""].filter(Boolean);
  return parts.join(" - ");
}

export function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
