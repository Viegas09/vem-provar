/* ── Marca (Manual v1.0) ───────────────────────────── */
export const C = {
  orange: "#EE6C1A",
  orangeDark: "#D65E12",
  black: "#141414",
  white: "#FAFAF7",
  gray: "#B8B2A6",
  grayText: "#7C776D",
  line: "rgba(20,20,20,0.09)",
  surface: "#F1EEE8",
  ok: "#2E9E5B",
};

export const FONT = "'Poppins', ui-sans-serif, system-ui, sans-serif";

export const WARM = [
  "linear-gradient(140deg,#F2A24E,#D65E12)",
  "linear-gradient(140deg,#E8B04B,#C77A1E)",
  "linear-gradient(140deg,#DE8A5A,#A85431)",
  "linear-gradient(140deg,#EFC38A,#D98E3D)",
  "linear-gradient(140deg,#E27A52,#B84A28)",
];

export function formatBRL(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
