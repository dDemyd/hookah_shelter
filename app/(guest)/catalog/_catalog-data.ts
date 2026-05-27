import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { TOBACCO_MAX_STRENGTH } from "@/lib/constants";

export type CatalogTobacco = {
  id: string;
  brand: string;
  flavor: string;
  /** Ukrainian display name. */
  uname: string;
  cat: string;
  strength: number;
  smoke: number;
  imageUrl?: string | null;
  /** Accent color used in jar SVG + picked-state badge. */
  color: string;
  popularity: number;
  inStock: boolean;
  isNew: boolean;
  desc: string;
  pairs: string[];
};

export type CatalogCategory = {
  id: string;
  label: string;
  emoji?: string | null;
  count?: number;
};

export const TOBACCO_CATALOG: CatalogTobacco[] = [
  // Darkside
  { id: "ds-cherry",    brand: "Darkside", flavor: "Cherry Core",      uname: "Вишневе ядро",      cat: "berries", strength: 4, smoke: 4, color: "#c5183a", popularity: 5, inStock: true,  isNew: false, desc: "Спіла темна вишня з гірчинкою кісточки. Шовкове ядро смаку.", pairs: ["Лід", "Ваніль", "Мигдаль"] },
  { id: "ds-mint",      brand: "Darkside", flavor: "Generation Mint",  uname: "Покоління м'яти",   cat: "mint",    strength: 3, smoke: 5, color: "#1ec27a", popularity: 5, inStock: true,  isNew: false, desc: "Холодний бриз — стане базою для будь-якого мікса.",          pairs: ["Цитруси", "Ягоди", "Тропіки"] },
  { id: "ds-blueberry", brand: "Darkside", flavor: "Supernova",        uname: "Чорничний холод",   cat: "berries", strength: 4, smoke: 4, color: "#3a4dcc", popularity: 4, inStock: false, isNew: false, desc: "Темна чорниця з холодком, як зимова ніч.",                  pairs: ["Лимон", "М'ята"] },
  { id: "ds-cola",      brand: "Darkside", flavor: "Code Cola",        uname: "Код кола",          cat: "dessert", strength: 3, smoke: 4, color: "#7a3814", popularity: 3, inStock: true,  isNew: true,  desc: "Ностальгійна кола з бульбашками — мікс-кода для десертів.", pairs: ["Лимон", "Лід", "Виноград"] },

  // Musthave
  { id: "mh-mango",    brand: "Musthave", flavor: "Mango",       uname: "Манго",             cat: "tropical", strength: 2, smoke: 4, color: "#f0a523", popularity: 5, inStock: true, isNew: false, desc: "Соковите тропічне манго — солодке без сиропу.",    pairs: ["М'ята", "Маракуйя", "Лід"] },
  { id: "mh-grape",    brand: "Musthave", flavor: "Sour Grape",  uname: "Кислий виноград",   cat: "berries", strength: 3, smoke: 4, color: "#7a2bb8", popularity: 4, inStock: true, isNew: false, desc: "Зелений виноград із характерною кислинкою.",       pairs: ["Кардамон", "М'ята"] },
  { id: "mh-citrus",   brand: "Musthave", flavor: "Citrus Mix",  uname: "Цитрусовий мікс",   cat: "citrus",  strength: 3, smoke: 4, color: "#ffb030", popularity: 4, inStock: true, isNew: false, desc: "Грейпфрут, апельсин, лимон — одним диханням.",     pairs: ["М'ята", "Імбир"] },
  { id: "mh-ice",      brand: "Musthave", flavor: "Ice Bomb",    uname: "Льодова бомба",     cat: "mint",    strength: 4, smoke: 5, color: "#5fdcd4", popularity: 3, inStock: true, isNew: true,  desc: "Експлозія холоду. Не для всіх.",                    pairs: ["Тропіки", "Цитруси"] },

  // Element
  { id: "el-pear",     brand: "Element", flavor: "Smoke Pear",      uname: "Димна груша",        cat: "dessert", strength: 4, smoke: 5, color: "#a8b53a", popularity: 5, inStock: true,  isNew: true,  desc: "Стигла груша, обкурена димком. Глибокий смак.",     pairs: ["Кардамон", "Ваніль"] },
  { id: "el-peach",    brand: "Element", flavor: "Peach",           uname: "Персик",             cat: "tropical", strength: 2, smoke: 4, color: "#ff8a5e", popularity: 4, inStock: true,  isNew: false, desc: "Аромат серпневого персика — лагідний, але виразний.", pairs: ["Чорниця", "М'ята"] },
  { id: "el-cardamom", brand: "Element", flavor: "Cardamom",        uname: "Кардамон",           cat: "spicy",   strength: 5, smoke: 3, color: "#8a5a2a", popularity: 3, inStock: true,  isNew: false, desc: "Гострий, пряний, з гірчинкою — для досвідчених.",    pairs: ["Кава", "Цитруси"] },
  { id: "el-lemon",    brand: "Element", flavor: "Sicilian Lemon",  uname: "Сицилійський лимон", cat: "citrus",  strength: 2, smoke: 4, color: "#ffd84a", popularity: 4, inStock: false, isNew: false, desc: "Сонячний лимон без кислоти — як лимончело.",         pairs: ["М'ята", "Базилік"] },

  // 420
  { id: "420-blackberry", brand: "420", flavor: "Black Mamba",     uname: "Чорна мамба",        cat: "berries", strength: 5, smoke: 5, color: "#2a0d3a", popularity: 4, inStock: true, isNew: true,  desc: "Чорна смородина, ожина і темний кардамон — небезпечний укус.", pairs: ["Виноград", "Кардамон"] },
  { id: "420-grapefruit", brand: "420", flavor: "Pink Grapefruit", uname: "Рожевий грейпфрут",  cat: "citrus",  strength: 3, smoke: 4, color: "#ff6b8a", popularity: 5, inStock: true, isNew: false, desc: "Гірчинка грейпфрута + холодок. Класика.",                      pairs: ["М'ята", "Полуниця"] },
  { id: "420-rasp",       brand: "420", flavor: "Raspberry Jam",   uname: "Малинове варення",   cat: "berries", strength: 4, smoke: 5, color: "#d61f4d", popularity: 4, inStock: true, isNew: false, desc: "Бабусина баночка варення — теплий цукор і ягоди.",             pairs: ["Ваніль", "Лід"] },
  { id: "420-vanilla",    brand: "420", flavor: "Vanilla Caramel", uname: "Ванільна карамель",  cat: "dessert", strength: 2, smoke: 4, color: "#c98b3c", popularity: 3, inStock: true, isNew: false, desc: "Бурбонна ваніль і солона карамель — десерт у диму.",           pairs: ["Кава", "Полуниця"] },

  // Tangiers
  { id: "tg-mango",  brand: "Tangiers", flavor: "Kashmir Mango",   uname: "Кашмір манго",   cat: "tropical", strength: 5, smoke: 5, color: "#e07a14", popularity: 5, inStock: true,  isNew: true,  desc: "Густе тропічне манго, азійський темпер.",  pairs: ["Лід", "Кокос"] },
  { id: "tg-cane",   brand: "Tangiers", flavor: "Cane Mint",       uname: "Тростинна м'ята", cat: "mint",   strength: 4, smoke: 5, color: "#3ad6a0", popularity: 4, inStock: true,  isNew: false, desc: "Цукрова тростина + м'ята. Чистий профіль.", pairs: ["Цитруси", "Дині"] },
  { id: "tg-mel",    brand: "Tangiers", flavor: "Honeydew Melon",  uname: "Медова диня",     cat: "tropical", strength: 4, smoke: 5, color: "#c8e060", popularity: 3, inStock: false, isNew: false, desc: "Літня медова диня. Тонкий профіль.",        pairs: ["М'ята", "Кавун"] },
  { id: "tg-burley", brand: "Tangiers", flavor: "Cane Burley",     uname: "Чистий тютюн",    cat: "tobacco",strength: 5, smoke: 4, color: "#6d4a26", popularity: 2, inStock: true,  isNew: false, desc: "Без ароматизаторів. Тільки тютюн і дим.",  pairs: ["Кардамон", "Кориця"] },
];

export const BRANDS = ["Усі", "Darkside", "Musthave", "Element", "420", "Tangiers"] as const;

export const CATALOG_CATEGORIES = [
  { id: "all",     label: "Усі" },
  { id: "citrus",  label: "Цитрусові" },
  { id: "berries", label: "Ягоди" },
  { id: "mint",    label: "М'ята" },
  { id: "dessert", label: "Десерт" },
  { id: "spicy",   label: "Пряне" },
  { id: "tobacco", label: "Тютюнові" },
  { id: "tropical", label: "Тропіки" },
] as const;

export const SORT_OPTIONS = [
  { id: "popular",  label: "За популярністю" },
  { id: "name",     label: "За назвою" },
  { id: "strength", label: "За міцністю" },
] as const;

export type SortBy = (typeof SORT_OPTIONS)[number]["id"];

export const CAT_LABEL: Record<string, string> = Object.fromEntries(
  CATALOG_CATEGORIES.map((c) => [c.id, c.label]),
);

/** Ukrainian plural: 1 смак, 2-4 смаки, 5+ смаків. */
export function pluralForm(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

const CATEGORY_COLORS: Record<string, string> = {
  citrus: "#ffb030",
  berries: "#d61f4d",
  mint: "#1ec27a",
  dessert: "#c98b3c",
  spicy: "#ff4500",
  tropical: "#f0a523",
  tobacco: "#8a5a2a",
};

type TobaccoRow = {
  id: string;
  name: string;
  description: string | null;
  strength: number;
  smoke: number | null;
  color: string | null;
  image_url: string | null;
  in_stock: boolean;
  popularity: number;
  created_at: string;
  tobacco_brands: { name: string } | { name: string }[] | null;
  flavor_categories:
    | { name: string; slug: string; emoji: string | null }
    | { name: string; slug: string; emoji: string | null }[]
    | null;
};

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function isRecentlyCreated(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - created < thirtyDays;
}

export function mapTobaccoRow(row: TobaccoRow): CatalogTobacco {
  const brand = firstRelation(row.tobacco_brands)?.name ?? "Без бренду";
  const category = firstRelation(row.flavor_categories);
  const cat = category?.slug ?? "other";
  const color = row.color ?? CATEGORY_COLORS[cat] ?? "#ff8a3d";

  return {
    id: row.id,
    brand,
    flavor: row.name,
    uname: row.name,
    cat,
    strength: Math.min(TOBACCO_MAX_STRENGTH, row.strength),
    smoke: row.smoke ?? 4,
    imageUrl: row.image_url,
    color,
    popularity: row.popularity,
    inStock: row.in_stock,
    isNew: isRecentlyCreated(row.created_at),
    desc: row.description ?? `${brand} ${row.name}`,
    pairs: [],
  };
}

export async function fetchCatalogTobaccos(): Promise<CatalogTobacco[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("tobaccos")
    .select(
      "id,name,description,strength,smoke,color,image_url,in_stock,popularity,created_at,tobacco_brands(name),flavor_categories(name,slug,emoji)",
    )
    .eq("is_active", true)
    .order("in_stock", { ascending: false })
    .order("popularity", { ascending: false });

  if (error) throw error;
  return (data as unknown as TobaccoRow[]).map(mapTobaccoRow);
}

export async function fetchCatalogCategories(): Promise<CatalogCategory[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("flavor_categories")
    .select("name,slug,emoji,sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return [
    { id: "all", label: "Усі" },
    ...data.map((category) => ({
      id: category.slug,
      label: category.name,
      emoji: category.emoji,
    })),
  ];
}
