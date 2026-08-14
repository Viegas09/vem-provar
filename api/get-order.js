import { supabaseAdmin } from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  const orderId = req.query.id;
  if (!orderId || typeof orderId !== "string") {
    res.status(400).json({ error: "missing id" });
    return;
  }

  try {
    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("orders")
      .select("*, order_items(*), restaurants(name)")
      .eq("id", orderId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "not found" });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("get-order error", err);
    res.status(500).json({ error: "internal error" });
  }
}
