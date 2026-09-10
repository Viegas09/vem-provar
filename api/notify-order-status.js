import { supabaseAdmin } from "./_supabaseAdmin.js";
import { notifyUser } from "./_push.js";

const MESSAGES = {
  preparing: { title: "Pedido em preparo 👨‍🍳", body: (r) => `${r} começou a preparar seu pedido.` },
  out_for_delivery: { title: "Pedido saiu para entrega 🛵", body: () => "Seu pedido está a caminho." },
  delivered: { title: "Pedido entregue 🎉", body: () => "Bom apetite! Não esquece de avaliar." },
  cancelled: { title: "Pedido cancelado", body: () => "Seu pedido foi cancelado." },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  const { orderId, status } = req.body || {};
  const msg = MESSAGES[status];
  if (!orderId || !msg) {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    const admin = supabaseAdmin();
    const { data: order } = await admin
      .from("orders")
      .select("id, customer_id, restaurants(name)")
      .eq("id", orderId)
      .maybeSingle();

    if (!order?.customer_id) {
      res.status(200).json({ ok: true });
      return;
    }

    await notifyUser(admin, order.customer_id, {
      title: msg.title,
      body: msg.body(order.restaurants?.name || "O restaurante"),
      url: `/pedido/${orderId}`,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("notify-order-status error", err);
    res.status(200).json({ ok: true });
  }
}
