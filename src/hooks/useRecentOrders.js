import { useEffect, useState } from "react";
import { fetchOrdersForCustomer } from "../data/queries";

export function useRecentOrders(userId, limit = 6) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchOrdersForCustomer(userId)
      .then((data) => {
        if (cancelled) return;
        const seen = new Set();
        const recent = [];
        for (const order of data) {
          const r = order.restaurants;
          if (!r || seen.has(r.slug)) continue;
          seen.add(r.slug);
          recent.push(order);
          if (recent.length >= limit) break;
        }
        setOrders(recent);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, limit]);

  return { orders, loading };
}
