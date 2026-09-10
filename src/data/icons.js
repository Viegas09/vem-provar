import {
  Pizza, Sandwich, Fish, Coffee, CakeSlice, Soup, Salad, CupSoda, Store,
} from "lucide-react";

export const ICONS = {
  pizza: Pizza,
  sandwich: Sandwich,
  fish: Fish,
  coffee: Coffee,
  cake: CakeSlice,
  soup: Soup,
  salad: Salad,
  cup: CupSoda,
  store: Store,
};

// pra dar mais variedade visual às fotos de prato sem imagem (hoje viravam
// todas o mesmo garfo-e-faca genérico) — chuta um ícone por palavra-chave no
// nome/categoria do item, usando o mesmo conjunto de ícones das categorias
const DISH_KEYWORDS = [
  { icon: Pizza, words: ["pizza", "calabresa", "margherita", "mussarela", "muçarela"] },
  { icon: Sandwich, words: ["burger", "burguer", "hambúrguer", "hamburguer", "sanduíche", "sanduiche", "lanche", "batata", "fritas", "wrap", "hot dog", "cachorro-quente"] },
  { icon: Fish, words: ["sushi", "sashimi", "temaki", "hot roll", "uramaki", "peixe", "salmão", "salmao", "camarão", "camarao"] },
  { icon: Coffee, words: ["café", "cafe", "cappuccino", "expresso", "espresso", "latte", "chá", "cha"] },
  { icon: CakeSlice, words: ["bolo", "doce", "sobremesa", "torta", "brownie", "pudim", "sorvete", "milkshake", "açaí", "acai"] },
  { icon: Soup, words: ["sopa", "marmita", "caldo", "feijoada", "prato feito", "pf "] },
  { icon: Salad, words: ["salada", "vegano", "vegetariano", "fit", "light", "bowl"] },
  { icon: CupSoda, words: ["suco", "refrigerante", "coca", "guaraná", "guarana", "bebida", "água", "agua", "cerveja", "drink"] },
];

export function guessDishIcon(item, fallback) {
  const text = `${item?.category || ""} ${item?.name || ""}`.toLowerCase();
  const match = DISH_KEYWORDS.find(({ words }) => words.some((w) => text.includes(w)));
  return match?.icon || fallback || Store;
}

export const CATS = [
  { key: "pizza", label: "Pizza", icon: Pizza, bg: "linear-gradient(140deg,#F2A24E,#D65E12)" },
  { key: "sandwich", label: "Lanches", icon: Sandwich, bg: "linear-gradient(140deg,#F0743F,#C23A1E)" },
  { key: "fish", label: "Japonês", icon: Fish, bg: "linear-gradient(140deg,#5B4A6F,#2E2440)" },
  { key: "coffee", label: "Café", icon: Coffee, bg: "linear-gradient(140deg,#8C6248,#5A3B27)" },
  { key: "cake", label: "Doces", icon: CakeSlice, bg: "linear-gradient(140deg,#EC6FA0,#C23D74)" },
  { key: "soup", label: "Marmita", icon: Soup, bg: "linear-gradient(140deg,#C9924A,#8C5E24)" },
  { key: "salad", label: "Saudável", icon: Salad, bg: "linear-gradient(140deg,#6FB25B,#2E7D42)" },
  { key: "cup", label: "Bebidas", icon: CupSoda, bg: "linear-gradient(140deg,#3FA6A0,#1F6E68)" },
];
