import { supabaseAdmin } from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const { orderId, origin } = req.body || {};
  if (!orderId || !origin) {
    res.status(400).json({ error: "missing_params" });
    return;
  }

  try {
    const admin = supabaseAdmin();

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, restaurant_id, total, commission_amount")
      .eq("id", orderId)
      .maybeSingle();
    if (orderError || !order) {
      res.status(404).json({ error: "order_not_found" });
      return;
    }

    const { data: restaurant, error: restError } = await admin
      .from("restaurants")
      .select("id, name, mp_connected")
      .eq("id", order.restaurant_id)
      .maybeSingle();
    if (restError || !restaurant || !restaurant.mp_connected) {
      res.status(400).json({ error: "restaurant_not_connected" });
      return;
    }

    const { data: credentials, error: credError } = await admin
      .from("restaurant_mp_credentials")
      .select("access_token")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle();
    if (credError || !credentials) {
      res.status(400).json({ error: "restaurant_not_connected" });
      return;
    }

    const preferenceRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credentials.access_token}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: `Pedido ${order.id.slice(0, 8)} · ${restaurant.name}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(order.total),
          },
        ],
        marketplace_fee: Number(order.commission_amount || 0),
        external_reference: order.id,
        back_urls: {
          success: `${origin}/pedido-confirmado?orderId=${order.id}`,
          failure: `${origin}/checkout?mp=failed`,
          pending: `${origin}/pedido/${order.id}`,
        },
        auto_return: "approved",
        notification_url: `${origin}/api/mp-webhook`,
      }),
    });
    const preference = await preferenceRes.json();
    if (!preferenceRes.ok || !preference.id) {
      console.error("mp-create-preference: mercado pago error", preference);
      res.status(502).json({ error: "mercadopago_error" });
      return;
    }

    await admin.from("orders").update({ mp_preference_id: preference.id }).eq("id", order.id);

    res.status(200).json({
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    });
  } catch (err) {
    console.error("mp-create-preference error", err);
    res.status(500).json({ error: "internal_error" });
  }
}
