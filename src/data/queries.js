import { supabase } from "../lib/supabase";

const MENU_ITEMS_SELECT = "*, menu_items(*, complement_groups(*, complement_items(*)))";

export async function fetchRestaurants() {
  const { data, error } = await supabase
    .from("restaurants")
    .select(MENU_ITEMS_SELECT)
    .order("name");
  if (error) throw error;
  return data;
}

export async function fetchRestaurantBySlug(slug) {
  const { data, error } = await supabase
    .from("restaurants")
    .select(MENU_ITEMS_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createOrder({ restaurantId, customerId, address, paymentMethod, subtotal, deliveryFee, total, items, commissionRate, commissionAmount, restaurantPayout }) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: restaurantId,
      customer_id: customerId || null,
      address,
      payment_method: paymentMethod,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      restaurant_payout: restaurantPayout,
      payment_status: "simulated",
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
      notes: item.notes || null,
      complements: item.complements || [],
    }))
  );
  if (itemsError) throw itemsError;

  return order;
}

export async function fetchRestaurantByOwner(ownerId) {
  const { data, error } = await supabase
    .from("restaurants")
    .select(MENU_ITEMS_SELECT)
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
  return data;
}

export async function updateRestaurant(id, changes) {
  const { error } = await supabase.from("restaurants").update(changes).eq("id", id);
  if (error) throw error;
}

export async function createMenuItem(item) {
  const { data, error } = await supabase.from("menu_items").insert(item).select().single();
  if (error) throw error;
  return data;
}

export async function uploadMenuItemPhoto(restaurantId, file) {
  const ext = file.name.split(".").pop();
  const path = `${restaurantId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("menu-photos").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("menu-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function updateMenuItem(id, changes) {
  const { error } = await supabase.from("menu_items").update(changes).eq("id", id);
  if (error) throw error;
}

export async function deleteMenuItem(id) {
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw error;
}

export async function createComplementGroup(menuItemId, group) {
  const { data, error } = await supabase
    .from("complement_groups")
    .insert({ menu_item_id: menuItemId, ...group })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComplementGroup(id) {
  const { error } = await supabase.from("complement_groups").delete().eq("id", id);
  if (error) throw error;
}

export async function createComplementItem(groupId, item) {
  const { data, error } = await supabase
    .from("complement_items")
    .insert({ group_id: groupId, ...item })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComplementItem(id) {
  const { error } = await supabase.from("complement_items").delete().eq("id", id);
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

export async function fetchOrderById(orderId) {
  const res = await fetch(`/api/get-order?id=${encodeURIComponent(orderId)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Não foi possível carregar o pedido.");
  return res.json();
}

export async function updateOrderStatus(orderId, status) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) throw error;
}

export async function fetchDriverByUser(userId) {
  const { data, error } = await supabase.from("drivers").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createDriver(driver) {
  const { data, error } = await supabase.from("drivers").insert(driver).select().single();
  if (error) throw error;
  return data;
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAllOrdersAdmin() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), restaurants(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchAllDriversAdmin() {
  const { data, error } = await supabase.from("drivers").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, changes) {
  const { error } = await supabase.from("profiles").update(changes).eq("id", userId);
  if (error) throw error;
}

export async function fetchOrdersForCustomer(customerId) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), restaurants(name, slug, icon_key, color_variant)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchFavorites(userId) {
  const { data, error } = await supabase
    .from("favorites")
    .select("*, restaurants(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addFavorite(userId, restaurantId) {
  const { error } = await supabase.from("favorites").insert({ user_id: userId, restaurant_id: restaurantId });
  if (error) throw error;
}

export async function removeFavorite(userId, restaurantId) {
  const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("restaurant_id", restaurantId);
  if (error) throw error;
}

export async function fetchOrderMessages(orderId) {
  const { data, error } = await supabase
    .from("order_messages")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function sendOrderMessage(orderId, sender, body) {
  const { data, error } = await supabase
    .from("order_messages")
    .insert({ order_id: orderId, sender, body })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function savePushSubscription(userId, subscription) {
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { user_id: userId, endpoint: subscription.endpoint, p256dh: subscription.p256dh, auth: subscription.auth },
      { onConflict: "endpoint" }
    );
  if (error) throw error;
}

export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data;
}

export async function markNotificationRead(id) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  if (error) throw error;
}

export async function fetchAddresses(userId) {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAddress(address) {
  const { data, error } = await supabase.from("addresses").insert(address).select().single();
  if (error) throw error;
  return data;
}

export async function updateAddress(id, changes) {
  const { error } = await supabase.from("addresses").update(changes).eq("id", id);
  if (error) throw error;
}

export async function deleteAddress(id) {
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) throw error;
}

export async function setDefaultAddress(userId, addressId) {
  const { error: clearError } = await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
  if (clearError) throw clearError;
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", addressId);
  if (error) throw error;
}
