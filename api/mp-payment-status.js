import { supabaseAdmin } from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const { orderId } = req.query;
  if (!orderId) {
    res.status(400).json({ error: "missing_params" });
    return;
  }

  try {
    const admin = supabaseAdmin();
    const { data: order, error } = await admin
      .from("orders")
      .select("id, mp_payment_id, payment_status")
      .eq("id", orderId)
      .maybeSingle();
    if (error || !order || !order.mp_payment_id) {
      res.status(200).json({ status: order?.payment_status || null });
      return;
    }

    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${order.mp_payment_id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_PLATFORM_ACCESS_TOKEN}` },
    });
    if (!paymentRes.ok) {
      res.status(200).json({ status: order.payment_status });
      return;
    }
    const payment = await paymentRes.json();
    if (payment.status && payment.status !== order.payment_status) {
      await admin.from("orders").update({ payment_status: payment.status }).eq("id", orderId);
    }
    res.status(200).json({ status: payment.status || order.payment_status, statusDetail: payment.status_detail || null });
  } catch (err) {
    console.error("mp-payment-status error", err);
    res.status(200).json({ status: null });
  }
}
