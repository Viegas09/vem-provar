const EVERY_N_ORDERS = 5;
const DISCOUNT_PERCENT = 10;
const EXPIRES_DAYS = 30;

// sem caracteres ambíguos (0/O, 1/I) pra não confundir quando o cliente digita o código
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode() {
  let s = "";
  for (let i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return `FIEL${s}`;
}

// gera um cupom pessoal (customer_id preenchido) a cada N pedidos entregues do
// cliente — chamado só quando um pedido vira "delivered". source_order_id evita
// premiar duas vezes se o mesmo pedido disparar essa rota mais de uma vez.
export async function maybeAwardLoyaltyCoupon(admin, customerId, orderId) {
  const { data: existing } = await admin.from("coupons").select("id").eq("source_order_id", orderId).maybeSingle();
  if (existing) return null;

  const { count } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("status", "delivered");
  if (!count || count % EVERY_N_ORDERS !== 0) return null;

  const expiresAt = new Date(Date.now() + EXPIRES_DAYS * 24 * 60 * 60 * 1000).toISOString();

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await admin
      .from("coupons")
      .insert({
        code: randomCode(),
        restaurant_id: null,
        customer_id: customerId,
        source_order_id: orderId,
        discount_type: "percent",
        discount_value: DISCOUNT_PERCENT,
        min_order_value: 0,
        max_uses: 1,
        expires_at: expiresAt,
        active: true,
      })
      .select()
      .single();
    if (!error) return data;
    if (error.code !== "23505") {
      console.error("maybeAwardLoyaltyCoupon insert error", error);
      return null;
    }
    // código colidiu com um já existente — tenta de novo com outro código aleatório
  }
  return null;
}
