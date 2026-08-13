import { useState } from "react";

function isStandaloneApp() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function useAppMode() {
  const [isAppMode] = useState(isStandaloneApp);
  return isAppMode;
}
