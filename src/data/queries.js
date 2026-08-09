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

export async function fetchRestaurantByOwner(ownerId) {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*, menu_items(*)")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function slugExists(slug) {
  const { data, error } = await supabase.from("restaurants").select("id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function createRestaurant(restaurant) {
  const { data, error } = await supabase.from("restaurants").insert(restaurant).select().single();
  if (error) throw error;
  await supabase.from("profiles").update({ role: "restaurant" }).eq("id", restaurant.owner_id);
  return data;
}

export async function createMenuItem(item) {
  const { data, error } = await supabase.from("menu_items").insert(item).select().single();
  if (error) throw error;
  return data;
}

export async function updateMenuItem(id, changes) {
  const { error } = await supabase.from("menu_items").update(changes).eq("id", id);
  if (error) throw error;
}

export async function deleteMenuItem(id) {
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchOrdersForRestaurant(restaurantId) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
