const now = new Date();
const todayISO = (h) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), h).toISOString();

const OWNED_RESTAURANT = {
  id: "r1", slug: "pizzaria-do-bairro", name: "Pizzaria do Bairro", category: "Pizza · Italiana", icon_key: "pizza", color_variant: 0, rating: 4.7, delivery_time: "30-40", delivery_fee: 5,
  plan: "basico", promo_started_at: "2026-01-01T00:00:00Z", mp_connected: true, is_open: true,
  menu_items: [
    { id: "m1", name: "Pizza Margherita", description: "Molho, mussarela e manjericão fresco", price: 42.9, color_variant: 0, available: true },
    { id: "m2", name: "Pizza Calabresa", description: "Calabresa fatiada, cebola e azeitonas", price: 39.9, color_variant: 4, available: true },
  ],
};

const CLOSED_RESTAURANT = {
  id: "r2", slug: "burger-house", name: "Burger House", category: "Lanches · Hambúrguer", icon_key: "burger", color_variant: 1, rating: 4.5, delivery_time: "20-30", delivery_fee: 0,
  plan: "basico", promo_started_at: "2026-01-01T00:00:00Z", mp_connected: false, is_open: false,
  menu_items: [{ id: "m3", name: "Cheeseburger Duplo", description: "Dois hambúrgueres, queijo cheddar", price: 32.9, color_variant: 1, available: true }],
};

const MOCK_RESTAURANTS = [OWNED_RESTAURANT, CLOSED_RESTAURANT];

const MOCK_ORDERS = [
  { id: "o1", created_at: todayISO(19), address: "Rua das Flores, 123", status: "pending", total: 55, subtotal: 50, delivery_fee: 5,
    commission_rate: 8, commission_amount: 4, restaurant_payout: 46,
    order_items: [{ id: "oi1", name: "Pizza Margherita", price: 42.9, qty: 1, notes: "Sem cebola" }] },
  { id: "o2", created_at: todayISO(18), address: "Av. Central, 900", status: "preparing", total: 84.8, subtotal: 79.8, delivery_fee: 5,
    commission_rate: 8, commission_amount: 6.38, restaurant_payout: 73.42,
    order_items: [{ id: "oi2", name: "Pizza Calabresa", price: 39.9, qty: 2 }] },
  { id: "o4", created_at: todayISO(12), address: "Praça da Serra, 10", status: "delivered", total: 48.9, subtotal: 42.9, delivery_fee: 6,
    commission_rate: 0, commission_amount: 0, restaurant_payout: 42.9,
    order_items: [{ id: "oi4", name: "Pizza Margherita", price: 42.9, qty: 1 }] },
];

export async function fetchRestaurants() { return MOCK_RESTAURANTS; }
export async function fetchRestaurantBySlug(slug) { return MOCK_RESTAURANTS.find((r) => r.slug === slug) || null; }
export async function createOrder(order) { return { id: "mock-order-123", ...order }; }
export async function fetchRestaurantByOwner() { return { ...OWNED_RESTAURANT }; }
export async function slugExists() { return false; }
export async function createRestaurant(r) { return { id: "mock", ...r }; }
export async function createMenuItem(i) { return { id: "mock", ...i }; }
export async function updateMenuItem() {}
export async function deleteMenuItem() {}
export async function updateRestaurant(id, changes) {
  const r = MOCK_RESTAURANTS.find((x) => x.id === id);
  if (r) Object.assign(r, changes);
}
export async function fetchOrdersForRestaurant() { return MOCK_ORDERS; }
export async function fetchOrderById() { return null; }
export async function updateOrderStatus() {}
export async function fetchDriverByUser() { return null; }
export async function createDriver(d) { return { id: "mock", ...d }; }
export async function fetchProfile() { return { role: "admin" }; }
export async function updateProfile() {}
export async function fetchAllOrdersAdmin() { return []; }
export async function fetchAllDriversAdmin() { return []; }
export async function fetchOrdersForCustomer() { return []; }
export async function fetchFavorites() { return []; }
export async function addFavorite() {}
export async function removeFavorite() {}
