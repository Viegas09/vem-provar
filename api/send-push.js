import { supabaseAdmin } from "./_supabaseAdmin.js";
import { notifyUser } from "./_push.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  const { orderId, sender, body } = req.body || {};
  if (!orderId || !sender || !body) {
    res.status(400).json({ ok: false });
    return;
  }

  try {
    const admin = supabaseAdmin();
    const { data: order } = await admin
      .from("orders")
      .select("id, customer_id, restaurants(name, owner_id)")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) {
      res.status(200).json({ ok: true });
      return;
    }

    const recipientId = sender === "customer" ? order.restaurants?.owner_id : order.customer_id;
    if (!recipientId) {
      res.status(200).json({ ok: true });
      return;
    }

    const title = sender === "customer" ? "Nova mensagem do cliente" : `${order.restaurants?.name || "Restaurante"} respondeu`;
    const url = sender === "customer" ? "/parceiro/painel" : `/pedido/${orderId}`;

    await notifyUser(admin, recipientId, { title, body, url });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("send-push error", err);
    res.status(200).json({ ok: true });
  }
}
