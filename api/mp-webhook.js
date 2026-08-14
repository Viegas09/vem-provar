import { supabaseAdmin } from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  const query = req.query || {};
  const body = req.body || {};

  const paymentId = query.id || body?.data?.id || (query.topic === "payment" ? query.id : null);

  if (!paymentId) {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_PLATFORM_ACCESS_TOKEN}` },
    });
    if (!paymentRes.ok) {
      console.error("mp-webhook: failed to fetch payment", paymentId, paymentRes.status);
      res.status(200).json({ ok: true });
      return;
    }
    const payment = await paymentRes.json();
    const orderId = payment.external_reference;
    if (!orderId) {
      res.status(200).json({ ok: true });
      return;
    }

    const admin = supabaseAdmin();
    await admin
      .from("orders")
      .update({ payment_status: payment.status, mp_payment_id: String(paymentId) })
      .eq("id", orderId);

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("mp-webhook error", err);
    res.status(200).json({ ok: true });
  }
}
