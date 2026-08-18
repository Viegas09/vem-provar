import { supabaseAdmin } from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const { restaurantId } = req.body || {};
  if (!restaurantId) {
    res.status(400).json({ error: "missing_restaurant_id" });
    return;
  }

  try {
    const admin = supabaseAdmin();
    await admin.from("restaurant_mp_credentials").delete().eq("restaurant_id", restaurantId);
    const { error } = await admin.from("restaurants").update({ mp_connected: false }).eq("id", restaurantId);
    if (error) throw error;

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("mp-disconnect error", err);
    res.status(500).json({ error: "internal_error" });
  }
}
