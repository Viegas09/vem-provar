import { useEffect, useState } from "react";
import { fetchRestaurantBySlug } from "../data/queries";

export function useRestaurant(slug) {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    fetchRestaurantBySlug(slug)
      .then((data) => {
        if (!cancelled) setRestaurant(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { restaurant, loading, error };
}
