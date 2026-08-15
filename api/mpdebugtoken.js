import { supabaseAdmin } from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  const restaurantId = req.query.restaurantId;
  if (!restaurantId) {
    res.status(400).json({ error: "missing restaurantId" });
    return;
  }

  try {
    const admin = supabaseAdmin();
    const { data: credentials } = await admin
      .from("restaurant_mp_credentials")
      .select("access_token")
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (!credentials) {
      res.status(404).json({ error: "no credentials found for this restaurant" });
      return;
    }

    const meRes = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${credentials.access_token}` },
    });
    const me = await meRes.json();

    res.status(200).json({
      tokenPrefix: credentials.access_token.slice(0, 20),
      tokenLength: credentials.access_token.length,
      usersMeStatus: meRes.status,
      usersMeResponse: me,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
