import crypto from "node:crypto";
import { supabaseAdmin } from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const { orderId, origin, method, payerEmail, payerDocNumber, cardToken, paymentMethodId, installments, payer } = req.body || {};
  if (!orderId || !origin || !method) {
    res.status(400).json({ error: "missing_params" });
    return;
  }
  if (method === "pix" && (!payerEmail || !payerDocNumber)) {
    res.status(400).json({ error: "missing_payer_info" });
    return;
  }
  if (method === "card" && (!cardToken || !paymentMethodId)) {
    res.status(400).json({ error: "missing_card_info" });
    return;
  }
  if (method !== "pix" && method !== "card") {
    res.status(400).json({ error: "invalid_method" });
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

    const payload = {
      transaction_amount: Number(order.total),
      description: `Pedido ${order.id.slice(0, 8)} · ${restaurant.name}`,
      external_reference: order.id,
      notification_url: `${origin}/api/mp-webhook`,
      application_fee: Number(order.commission_amount || 0),
    };

    if (method === "pix") {
      payload.payment_method_id = "pix";
      payload.payer = { email: payerEmail, identification: { type: "CPF", number: String(payerDocNumber).replace(/\D/g, "") } };
    } else {
      payload.token = cardToken;
      payload.payment_method_id = paymentMethodId;
      payload.installments = installments || 1;
      payload.payer = payer;
    }

    const paymentRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credentials.access_token}`,
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
    });
    const payment = await paymentRes.json();
    if (!paymentRes.ok || !payment.id) {
      console.error("mp-create-payment: mercado pago error", payment);
      const causeDetail = Array.isArray(payment.cause) && payment.cause.length > 0
        ? payment.cause.map((c) => c.description || c.code).filter(Boolean).join("; ")
        : null;
      res.status(502).json({ error: "mercadopago_error", detail: causeDetail || payment.message || null });
      return;
    }

    await admin.from("orders").update({
      mp_payment_id: String(payment.id),
      payment_status: payment.status,
    }).eq("id", order.id);

    res.status(200).json({
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      pix: method === "pix" ? {
        qrCode: payment.point_of_interaction?.transaction_data?.qr_code || null,
        qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      } : null,
    });
  } catch (err) {
    console.error("mp-create-payment error", err);
    res.status(500).json({ error: "internal_error" });
  }
}
