import webpush from "web-push";
import { supabaseAdmin } from "./_supabaseAdmin.js";

const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL || "contato@vemprovar.com.br"}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

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

    await admin.from("notifications").insert({ user_id: recipientId, title, body, url });

    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      const { data: subs } = await admin.from("push_subscriptions").select("*").eq("user_id", recipientId);
      const payload = JSON.stringify({ title, body, url });

      await Promise.all(
        (subs || []).map((s) =>
          webpush
            .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
            .catch(async (err) => {
              if (err.statusCode === 404 || err.statusCode === 410) {
                await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
              }
            })
        )
      );
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("send-push error", err);
    res.status(200).json({ ok: true });
  }
}
