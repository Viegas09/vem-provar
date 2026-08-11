import { useEffect, useState } from "react";
import { fetchOrdersForCustomer } from "../data/queries";

export function useRecentRestaurants(userId) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRestaurants([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchOrdersForCustomer(userId)
      .then((orders) => {
        if (cancelled) return;
        const seen = new Set();
        const recent = [];
        for (const order of orders) {
          const r = order.restaurants;
          if (!r || seen.has(r.slug)) continue;
          seen.add(r.slug);
          recent.push(r);
          if (recent.length >= 8) break;
        }
        setRestaurants(recent);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { restaurants, loading };
}
