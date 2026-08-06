import {
  Pizza, Sandwich, Fish, Coffee, CakeSlice, Soup, Salad, CupSoda,
} from "lucide-react";

export const CATS = [
  { label: "Pizza", icon: Pizza },
  { label: "Lanches", icon: Sandwich },
  { label: "Japonês", icon: Fish },
  { label: "Café", icon: Coffee },
  { label: "Doces", icon: CakeSlice },
  { label: "Marmita", icon: Soup },
  { label: "Saudável", icon: Salad },
  { label: "Bebidas", icon: CupSoda },
];

export const HOOD = [
  { dish: "Pizza Margherita", rest: "Pizzaria do Bairro", tag: "18 pediram hoje", v: 0 },
  { dish: "Smash Duplo", rest: "Burguer da Serra", tag: "Bruno +3 recomendam", v: 4 },
  { dish: "Combo Temaki", rest: "Sushi Ita", tag: "12 pediram hoje", v: 2 },
  { dish: "Açaí 500ml", rest: "Açaí do Ponto", tag: "novo perto de você", v: 3 },
];

export const RESTAURANTS = [
  {
    slug: "pizzaria-do-bairro",
    name: "Pizzaria do Bairro",
    cat: "Pizza · Italiana",
    rating: 4.8,
    time: "30–40",
    fee: "Grátis",
    feeValue: 0,
    free: true,
    v: 0,
    icon: Pizza,
    menu: [
      { id: "pb-1", name: "Pizza Margherita", desc: "Molho de tomate, mussarela e manjericão fresco", price: 42.9, v: 0 },
      { id: "pb-2", name: "Pizza Calabresa", desc: "Calabresa fatiada, cebola e azeitonas", price: 39.9, v: 4 },
      { id: "pb-3", name: "Pizza Quatro Queijos", desc: "Mussarela, provolone, parmesão e gorgonzola", price: 44.9, v: 2 },
      { id: "pb-4", name: "Refrigerante Lata", desc: "350ml", price: 6.0, v: 3 },
    ],
  },
  {
    slug: "burguer-da-serra",
    name: "Burguer da Serra",
    cat: "Lanches · Hambúrguer",
    rating: 4.7,
    time: "25–35",
    fee: "R$ 4,99",
    feeValue: 4.99,
    free: false,
    v: 4,
    icon: Sandwich,
    menu: [
      { id: "bs-1", name: "Smash Duplo", desc: "Dois smash burgers, queijo cheddar e molho da casa", price: 28.9, v: 4 },
      { id: "bs-2", name: "Cheeseburguer Clássico", desc: "Burger 160g, queijo e picles", price: 24.9, v: 0 },
      { id: "bs-3", name: "Batata Frita", desc: "Porção individual crocante", price: 14.9, v: 2 },
      { id: "bs-4", name: "Milkshake", desc: "Chocolate, morango ou baunilha", price: 16.9, v: 3 },
    ],
  },
  {
    slug: "cafe-colina",
    name: "Café Colina",
    cat: "Café · Padaria",
    rating: 4.9,
    time: "15–25",
    fee: "Grátis",
    feeValue: 0,
    free: true,
    v: 3,
    icon: Coffee,
    menu: [
      { id: "cc-1", name: "Pão na Chapa", desc: "Pão francês na chapa com manteiga", price: 9.9, v: 3 },
      { id: "cc-2", name: "Cappuccino", desc: "300ml, espuma cremosa", price: 8.5, v: 0 },
      { id: "cc-3", name: "Croissant", desc: "Amanteigado, assado na hora", price: 11.9, v: 4 },
      { id: "cc-4", name: "Bolo do Dia", desc: "Fatia generosa, sabor variado", price: 10.0, v: 2 },
    ],
  },
  {
    slug: "sushi-ita",
    name: "Sushi Ita",
    cat: "Japonês · Sushi",
    rating: 4.8,
    time: "40–50",
    fee: "R$ 6,90",
    feeValue: 6.9,
    free: false,
    v: 2,
    icon: Fish,
    menu: [
      { id: "si-1", name: "Combo Temaki (2un)", desc: "Salmão e atum, à sua escolha", price: 32.9, v: 2 },
      { id: "si-2", name: "Combo 20 Peças", desc: "Sushi e sashimi sortidos", price: 54.9, v: 0 },
      { id: "si-3", name: "Hot Roll (10un)", desc: "Empanado, recheio de salmão cream cheese", price: 29.9, v: 4 },
      { id: "si-4", name: "Yakisoba", desc: "Macarrão oriental com legumes e frango", price: 34.9, v: 3 },
    ],
  },
];

export function getRestaurantBySlug(slug) {
  return RESTAURANTS.find((r) => r.slug === slug);
}
