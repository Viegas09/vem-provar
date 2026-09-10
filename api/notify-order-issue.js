import { supabaseAdmin } from "./_supabaseAdmin.js";
import { notifyUser } from "./_push.js";

const TYPE_LABELS = {
  item_faltando: "Item faltando",
  pedido_errado: "Pedido errado",
  qualidade: "Qualidade do prato",
  nao_chegou: "Pedido não chegou",
  outro: "Outro problema",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  const { orderId, type } = req.body || {};
  if (!orderId || !type) {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    const admin = supabaseAdmin();
    const { data: order } = await admin
      .from("orders")
      .select("id, restaurants(owner_id)")
      .eq("id", orderId)
      .maybeSingle();

    if (!order?.restaurants?.owner_id) {
      res.status(200).json({ ok: true });
      return;
    }

    await notifyUser(admin, order.restaurants.owner_id, {
      title: "Problema relatado num pedido",
      body: `${TYPE_LABELS[type] || "Problema"} · pedido #${orderId.slice(0, 8)}`,
      url: "/parceiro/painel",
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("notify-order-issue error", err);
    res.status(200).json({ ok: true });
  }
}
