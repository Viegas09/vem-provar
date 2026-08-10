import { useCallback, useEffect, useState } from "react";
import { fetchFavorites, addFavorite, removeFavorite } from "../data/queries";

export function useFavorites(userId) {
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchFavorites(userId).then((rows) => {
      if (cancelled) return;
      setFavoriteIds(new Set(rows.map((r) => r.restaurant_id)));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggle = useCallback(
    async (restaurantId) => {
      if (!userId) return;
      const wasFavorite = favoriteIds.has(restaurantId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(restaurantId);
        else next.add(restaurantId);
        return next;
      });
      try {
        if (wasFavorite) await removeFavorite(userId, restaurantId);
        else await addFavorite(userId, restaurantId);
      } catch {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(restaurantId);
          else next.delete(restaurantId);
          return next;
        });
      }
    },
    [userId, favoriteIds]
  );

  return { isFavorite: (id) => favoriteIds.has(id), toggle, loading };
}
