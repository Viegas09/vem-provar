export const PROMO_DAYS = 60;
export const COMMISSION_RATES = {
  basico: 8,
  entrega: 13,
};
export const DEFAULT_PLAN = "basico";

export function promoEndsAt(promoStartedAt) {
  const start = new Date(promoStartedAt);
  return new Date(start.getTime() + PROMO_DAYS * 24 * 60 * 60 * 1000);
}

export function isInPromoPeriod(promoStartedAt) {
  if (!promoStartedAt) return false;
  return new Date() < promoEndsAt(promoStartedAt);
}

export function getCommissionRate(restaurant) {
  if (isInPromoPeriod(restaurant?.promo_started_at)) return 0;
  return COMMISSION_RATES[restaurant?.plan] ?? COMMISSION_RATES[DEFAULT_PLAN];
}

export function calculateCommission(subtotal, commissionRate) {
  const commissionAmount = Math.round(subtotal * (commissionRate / 100) * 100) / 100;
  const restaurantPayout = Math.round((subtotal - commissionAmount) * 100) / 100;
  return { commissionAmount, restaurantPayout };
}
