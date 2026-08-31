import { C } from "../theme";

export const STATUS_META = {
  pending: { label: "Recebido", color: C.orange, bg: "rgba(238,108,26,.12)" },
  preparing: { label: "Em preparo", color: "#2E6FE2", bg: "rgba(46,111,226,.1)" },
  out_for_delivery: { label: "Saiu para entrega", color: "#7C4DFF", bg: "rgba(124,77,255,.1)" },
  delivered: { label: "Entregue", color: C.ok, bg: "rgba(46,158,91,.1)" },
  cancelled: { label: "Cancelado", color: "#B42318", bg: "#FDECEC" },
};
export const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label }));
export const OPEN_STATUSES = ["pending", "preparing", "out_for_delivery"];
export const NEXT_STATUS = {
  pending: { value: "preparing", label: "Aceitar e iniciar preparo" },
  preparing: { value: "out_for_delivery", label: "Saiu para entrega" },
  out_for_delivery: { value: "delivered", label: "Marcar como entregue" },
};
