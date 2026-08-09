import { useState } from "react";

const STORAGE_KEY = "vp-location";

function loadLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { address: "", latitude: null, longitude: null };
  } catch {
    return { address: "", latitude: null, longitude: null };
  }
}

export function useUserLocation() {
  const [location, setLocationState] = useState(loadLocation);

  function setLocation(next) {
    setLocationState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return [location, setLocation];
}
