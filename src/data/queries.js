import { supabase } from "../lib/supabase";

export async function fetchRestaurants() {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*, menu_items(*)")
    .order("name");
  if (error) throw error;
  return data;
}

export async function fetchRestaurantBySlug(slug) {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*, menu_items(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createOrder({ restaurantId, address, paymentMethod, subtotal, deliveryFee, total, items }) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: restaurantId,
      address,
      payment_method: paymentMethod,
      subtotal,
      delivery_fee: deliveryFee,
      total,
    })
    .select()
    .single();
  if (orderError) throw orderError;

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty,
    }))
  );
  if (itemsError) throw itemsError;

  return order;
}
