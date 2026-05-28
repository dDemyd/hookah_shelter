// Hardcoded mock data ported from design-reference/.../data.jsx.
// TODO(stage-4-db): replace each export with a React Query hook that reads from Supabase.
// The Сховище home renders these as-is; later screens will swap to live data.

export type SignatureMix = {
  id: string;
  name: string;
  desc: string;
  strength: number;
  price: number;
  /** CSS gradient for the card background. */
  accent: string;
  /** Decorative single-character mark in the top-right corner. */
  glyph: string;
};

export const SIGNATURE_MIXES: SignatureMix[] = [
  {
    id: "shelter",
    name: "Сховище",
    desc: "Хвойний дим, груша, крапля абсенту",
    strength: 4,
    price: 350,
    accent:
      "linear-gradient(135deg, #2a0d0d 0%, #3d1a0a 60%, #1a0e08 100%)",
    glyph: "🜂",
  },
  {
    id: "citrus",
    name: "Цитрусовий вибух",
    desc: "Грейпфрут, лайм, холодний імбир",
    strength: 2,
    price: 350,
    accent:
      "linear-gradient(135deg, #2a1d05 0%, #3d2a0a 60%, #150f05 100%)",
    glyph: "◐",
  },
  {
    id: "dessert",
    name: "Десерт ночі",
    desc: "Карамель, печений банан, какао",
    strength: 1,
    price: 350,
    accent:
      "linear-gradient(135deg, #1f120a 0%, #2a1810 60%, #100806 100%)",
    glyph: "✦",
  },
  {
    id: "bilatserkva",
    name: "Біла Церква",
    desc: "Вишня в диму, мигдаль, тютюн",
    strength: 3,
    price: 350,
    accent:
      "linear-gradient(135deg, #2a0808 0%, #3d0e0e 60%, #150404 100%)",
    glyph: "✚",
  },
  {
    id: "shadow",
    name: "Тінь",
    desc: "Чорна смородина, кардамон, мускат",
    strength: 5,
    price: 350,
    accent:
      "linear-gradient(135deg, #160a1f 0%, #251433 60%, #0a0610 100%)",
    glyph: "☾",
  },
];

export type CategoryCard = {
  id: string;
  emoji: string;
  label: string;
  count: number;
  hue: string;
};

export const CATEGORIES: CategoryCard[] = [
  { id: "berries", emoji: "🍓", label: "Ягоди", count: 32, hue: "#c5183a" },
  { id: "citrus", emoji: "🍋", label: "Цитрус", count: 25, hue: "#ff8a3d" },
  { id: "tropical", emoji: "🥭", label: "Тропіки", count: 24, hue: "#f0a523" },
  { id: "orchard", emoji: "🍏", label: "Садові фрукти", count: 20, hue: "#a8b53a" },
  { id: "dessert", emoji: "🍰", label: "Десерт", count: 18, hue: "#c98b3c" },
  { id: "candy", emoji: "🍬", label: "Цукерки", count: 14, hue: "#ff4d8d" },
  { id: "drinks", emoji: "🥤", label: "Напої", count: 12, hue: "#7a2bb8" },
  { id: "mint-cool", emoji: "❄️", label: "Холодок", count: 10, hue: "#1ec27a" },
  { id: "herbal", emoji: "🌿", label: "Трави та чай", count: 8, hue: "#5d8f4a" },
  { id: "spicy", emoji: "🌶️", label: "Пряне", count: 7, hue: "#ff4500" },
  { id: "savory", emoji: "🍕", label: "Гастро", count: 5, hue: "#bd6932" },
  { id: "tobacco", emoji: "🚬", label: "Тютюнові", count: 4, hue: "#8a5a2a" },
  { id: "other", emoji: "✨", label: "Інше", count: 1, hue: "#8a8f98" },
];

export type FreshTobacco = {
  id: string;
  brand: string;
  flavor: string;
  strength: number;
  /** CSS gradient for the jar background area. */
  bg: string;
};

export const FRESH_TOBACCOS: FreshTobacco[] = [
  {
    id: "ds-cherry",
    brand: "Darkside",
    flavor: "Cherry Core",
    strength: 4,
    bg: "radial-gradient(circle at 30% 30%, #4a0a14, #1a0408 70%)",
  },
  {
    id: "must-blackberry",
    brand: "MustHave",
    flavor: "Blackberry",
    strength: 3,
    bg: "radial-gradient(circle at 30% 30%, #2a0a3a, #0d0418 70%)",
  },
  {
    id: "satyr-mango",
    brand: "Satyr",
    flavor: "Mango Ice",
    strength: 2,
    bg: "radial-gradient(circle at 30% 30%, #3a2a08, #150f04 70%)",
  },
  {
    id: "ds-mint",
    brand: "Darkside",
    flavor: "Generation Of Mint",
    strength: 3,
    bg: "radial-gradient(circle at 30% 30%, #0a3a2a, #04150f 70%)",
  },
  {
    id: "element-pear",
    brand: "Element",
    flavor: "Smoke Pear",
    strength: 4,
    bg: "radial-gradient(circle at 30% 30%, #2a1a0a, #150d04 70%)",
  },
];
