import { useCallback, useEffect, useState } from "react";
import { fetchRestaurants } from "../data/queries";

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(() => {
    return fetchRestaurants()
      .then((data) => setRestaurants(data))
      .catch((err) => setError(err));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRestaurants()
      .then((data) => {
        if (!cancelled) setRestaurants(data);
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
  }, []);

  return { restaurants, loading, error, refetch };
}
