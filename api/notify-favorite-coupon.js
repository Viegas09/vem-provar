import { supabaseAdmin } from "./_supabaseAdmin.js";
import { notifyUser } from "./_push.js";

function discountLabel(discountType, discountValue) {
  if (discountType === "percent") return `${Number(discountValue)}% de desconto`;
  return `${Number(discountValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} de desconto`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  const { restaurantId, code, discountType, discountValue } = req.body || {};
  if (!restaurantId || !code) {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    const admin = supabaseAdmin();
    const { data: restaurant } = await admin.from("restaurants").select("name, slug").eq("id", restaurantId).maybeSingle();
    if (!restaurant) {
      res.status(200).json({ ok: true });
      return;
    }

    const { data: favorites } = await admin.from("favorites").select("user_id").eq("restaurant_id", restaurantId);

    await Promise.all(
      (favorites || []).map((f) =>
        notifyUser(admin, f.user_id, {
          title: `Novo cupom em ${restaurant.name}`,
          body: `${discountLabel(discountType, discountValue)} com o código ${code}`,
          url: restaurant.slug ? `/restaurante/${restaurant.slug}` : "/",
        })
      )
    );

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("notify-favorite-coupon error", err);
    res.status(200).json({ ok: true });
  }
}
