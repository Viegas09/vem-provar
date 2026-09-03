import { supabase } from "../lib/supabase";

const MENU_ITEMS_SELECT = "*, menu_items(*, complement_groups(*, complement_items(*)))";

// detecta "coluna ainda não existe" (código padrão do Postgres) pra cair num fallback
// em vez de quebrar, quando uma migração recente ainda não rodou no banco
function isMissingColumnError(error) {
  return error?.code === "42703" || /column .* does not exist/i.test(error?.message || "");
}

export async function fetchRestaurants() {
  const { data, error } = await supabase
    .from("restaurants")
    .select(MENU_ITEMS_SELECT)
    .eq("suspended", false)
    .order("name");
  if (error) {
    if (!isMissingColumnError(error)) throw error;
    const fallback = await supabase.from("restaurants").select(MENU_ITEMS_SELECT).order("name");
    if (fallback.error) throw fallback.error;
    return fallback.data;
  }
  return data;
}

export async function fetchRestaurantBySlug(slug) {
  const { data, error } = await supabase
    .from("restaurants")
    .select(MENU_ITEMS_SELECT)
    .eq("slug", slug)
    .eq("suspended", false)
    .maybeSingle();
  if (error) {
    if (!isMissingColumnError(error)) throw error;
    const fallback = await supabase.from("restaurants").select(MENU_ITEMS_SELECT).eq("slug", slug).maybeSingle();
    if (fallback.error) throw fallback.error;
    return fallback.data;
  }
  return data;
}

export async function createOrder({ restaurantId, customerId, address, latitude, longitude, paymentMethod, subtotal, deliveryFee, total, items, commissionRate, commissionAmount, restaurantPayout, couponCode, discountAmount, scheduledFor }) {
  const payload = {
    restaurant_id: restaurantId,
    customer_id: customerId || null,
    address,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    payment_method: paymentMethod,
    subtotal,
    delivery_fee: deliveryFee,
    total,
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    restaurant_payout: restaurantPayout,
    payment_status: "simulated",
    coupon_code: couponCode || null,
    discount_amount: discountAmount || 0,
    scheduled_for: scheduledFor || null,
  };
  let { data: order, error: orderError } = await supabase.from("orders").insert(payload).select().single();
  if (orderError && isMissingColumnError(orderError)) {
    // migração da coordenada de entrega (supabase-schema-39) ainda não rodou — segue sem elas
    const { latitude: _lat, longitude: _lng, ...withoutCoords } = payload;
    ({ data: order, error: orderError } = await supabase.from("orders").insert(withoutCoords).select().single());
  }
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

export async function uploadRestaurantPhoto(restaurantId, file) {
  const ext = file.name.split(".").pop();
  const path = `restaurant-banners/${restaurantId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("menu-photos").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("menu-photos").getPublicUrl(path);
  return data.publicUrl;
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

export async function updateDriver(id, changes) {
  const { error } = await supabase.from("drivers").update(changes).eq("id", id);
  if (error) throw error;
}

const DELIVERY_ORDER_FIELDS = "name, slug, address, latitude, longitude, icon_key, color_variant, plan";
const DELIVERY_RESTAURANT_FIELDS = `${DELIVERY_ORDER_FIELDS}, use_platform_drivers`;

export async function fetchAvailableDeliveries() {
  const { data, error } = await supabase
    .from("orders")
    .select(`*, order_items(*), restaurants!inner(${DELIVERY_RESTAURANT_FIELDS})`)
    .eq("status", "preparing")
    .is("driver_id", null)
    .eq("restaurants.plan", "entrega")
    .eq("restaurants.use_platform_drivers", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchDriverOrders(driverId) {
  const { data, error } = await supabase
    .from("orders")
    .select(`*, order_items(*), restaurants(${DELIVERY_ORDER_FIELDS})`)
    .eq("driver_id", driverId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// tenta pegar a corrida; se outro entregador já aceitou, `data` volta vazio
export async function claimDelivery(orderId, driverId) {
  const { data, error } = await supabase
    .from("orders")
    .update({ driver_id: driverId })
    .eq("id", orderId)
    .is("driver_id", null)
    .select();
  if (error) throw error;
  return (data || []).length > 0;
}

// tenta "travar" o oferecimento da corrida disponível mais antiga — o banco decide
// quem ganha: entre os entregadores disponíveis sem oferta ativa, o mais perto do
// restaurante (função no banco, pra não vazar a localização de um entregador pros outros)
export async function tryClaimOffer(driverId, lat, lng) {
  const { data, error } = await supabase.rpc("claim_nearest_offer", {
    p_driver_id: driverId,
    p_lat: lat ?? null,
    p_lng: lng ?? null,
  });
  if (error) {
    if (error.code === "23505") return null; // outro entregador travou no mesmo instante
    throw error;
  }
  return data;
}

export async function respondToOffer(offerId, status) {
  const { error } = await supabase.from("order_offers").update({ status }).eq("id", offerId);
  if (error) throw error;
}

export async function fetchMyActiveOffer(driverId) {
  const { data, error } = await supabase
    .from("order_offers")
    .select(`*, orders(*, order_items(*), restaurants(${DELIVERY_ORDER_FIELDS}))`)
    .eq("driver_id", driverId)
    .eq("status", "offered")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchProfilesByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error) throw error;
  return data;
}

export async function fetchAllRestaurantsAdmin() {
  const { data, error } = await supabase
    .from("restaurants")
    .select(MENU_ITEMS_SELECT)
    .order("name");
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

export async function fetchFavoriteItems(userId) {
  const { data, error } = await supabase
    .from("favorite_items")
    .select("*, menu_items(*, restaurants(name, slug, icon_key, color_variant))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addFavoriteItem(userId, menuItemId) {
  const { error } = await supabase.from("favorite_items").insert({ user_id: userId, menu_item_id: menuItemId });
  if (error) throw error;
}

export async function removeFavoriteItem(userId, menuItemId) {
  const { error } = await supabase.from("favorite_items").delete().eq("user_id", userId).eq("menu_item_id", menuItemId);
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

export async function fetchReviewsForCustomer(customerId) {
  const { data, error } = await supabase.from("reviews").select("*").eq("customer_id", customerId);
  if (error) throw error;
  return data;
}

export async function fetchReviewsForRestaurant(restaurantId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("hidden", false)
    .order("created_at", { ascending: false });
  if (error) {
    if (!isMissingColumnError(error)) throw error;
    // migração da moderação (supabase-schema-40) ainda não rodou — mostra tudo, sem filtrar
    const fallback = await supabase.from("reviews").select("*").eq("restaurant_id", restaurantId).order("created_at", { ascending: false });
    if (fallback.error) throw fallback.error;
    return fallback.data;
  }
  return data;
}

export async function fetchAllReviewsAdmin() {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, restaurants(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateReview(id, changes) {
  const { error } = await supabase.from("reviews").update(changes).eq("id", id);
  if (error) throw error;
}

export async function createReview({ orderId, restaurantId, customerId, customerName, rating, comment }) {
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      order_id: orderId,
      restaurant_id: restaurantId,
      customer_id: customerId,
      customer_name: customerName || null,
      rating,
      comment: comment || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCouponsForRestaurant(restaurantId) {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCoupon(coupon) {
  const { data, error } = await supabase.from("coupons").insert(coupon).select().single();
  if (error) throw error;
  return data;
}

export async function updateCoupon(id, changes) {
  const { error } = await supabase.from("coupons").update(changes).eq("id", id);
  if (error) throw error;
}

// cupom sem restaurant_id vale em qualquer loja — o Checkout já trata isso (linha
// que checa "coupon.restaurant_id && coupon.restaurant_id !== restaurant.id")
export async function fetchPlatformCoupons() {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .is("restaurant_id", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchCouponByCode(code) {
  const { data, error } = await supabase.from("coupons").select("*").eq("code", code).maybeSingle();
  if (error) throw error;
  return data;
}

export async function redeemCoupon({ code, restaurantId, subtotal }) {
  const { data, error } = await supabase.rpc("redeem_coupon", {
    p_code: code,
    p_restaurant_id: restaurantId,
    p_subtotal: subtotal,
  });
  if (error) throw error;
  return data;
}

export async function setDefaultAddress(userId, addressId) {
  const { error: clearError } = await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
  if (clearError) throw clearError;
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", addressId);
  if (error) throw error;
}
