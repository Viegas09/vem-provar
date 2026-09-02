import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// mantém uma lista de pedidos sempre atualizada sem depender de polling:
// assina mudanças na tabela orders via Supabase Realtime e invalida a query
// (opcionalmente filtrado por restaurante, pro painel do parceiro)
export function useOrdersRealtime(queryKey, { restaurantId, enabled = true } = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const options = { event: "*", schema: "public", table: "orders" };
    if (restaurantId) options.filter = `restaurant_id=eq.${restaurantId}`;

    const channel = supabase
      .channel(`orders-realtime-${restaurantId || "all"}`)
      .on("postgres_changes", options, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, enabled, JSON.stringify(queryKey)]);
}
