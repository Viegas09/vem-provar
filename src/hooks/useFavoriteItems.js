import { useCallback, useEffect, useState } from "react";
import { fetchFavoriteItems, addFavoriteItem, removeFavoriteItem } from "../data/queries";

export function useFavoriteItems(userId) {
  const [favoriteItemIds, setFavoriteItemIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setFavoriteItemIds(new Set());
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchFavoriteItems(userId).then((rows) => {
      if (cancelled) return;
      setFavoriteItemIds(new Set(rows.map((r) => r.menu_item_id)));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggle = useCallback(
    async (menuItemId) => {
      if (!userId) return;
      const wasFavorite = favoriteItemIds.has(menuItemId);
      setFavoriteItemIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(menuItemId);
        else next.add(menuItemId);
        return next;
      });
      try {
        if (wasFavorite) await removeFavoriteItem(userId, menuItemId);
        else await addFavoriteItem(userId, menuItemId);
      } catch {
        setFavoriteItemIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(menuItemId);
          else next.delete(menuItemId);
          return next;
        });
      }
    },
    [userId, favoriteItemIds]
  );

  return { isFavoriteItem: (id) => favoriteItemIds.has(id), toggle, loading };
}
