import { DEFAULT_PRICE_UAH } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SIGNATURE_MIXES } from "../_mock-data";
import { mapTobaccoRow, type CatalogTobacco } from "../catalog/_catalog-data";

export type PresetIngredient = {
  tobacco: CatalogTobacco;
  percentage: number;
};

export type PresetMix = {
  id: string;
  name: string;
  desc: string;
  strength: number;
  price: number;
  accent: string;
  imageUrl: string | null;
  glyph: string;
  isSignature: boolean;
  isMixOfDay: boolean;
  isNew: boolean;
  ingredients: PresetIngredient[];
  ratingAvg: number;
  ratingCount: number;
};

type PresetRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_signature: boolean;
  is_mix_of_day?: boolean;
  is_new: boolean;
  sort_order: number;
  rating_avg?: number | null;
  rating_count?: number | null;
  preset_mix_ingredients:
    | {
        percentage: number;
        tobaccos: Parameters<typeof mapTobaccoRow>[0] | null;
      }[]
    | null;
};

function fallbackPresetById(id: string): PresetMix | null {
  const fallback = SIGNATURE_MIXES.find((mix) => mix.id === id);
  if (!fallback) return null;
  return {
    id: fallback.id,
    name: fallback.name,
    desc: fallback.desc,
    strength: fallback.strength,
    price: fallback.price,
    accent: fallback.accent,
    imageUrl: null,
    glyph: fallback.glyph,
    isSignature: true,
    isMixOfDay: false,
    isNew: false,
    ingredients: [],
    ratingAvg: 0,
    ratingCount: 0,
  };
}

function fallbackPresets(): PresetMix[] {
  return SIGNATURE_MIXES.map((mix) => fallbackPresetById(mix.id)!);
}

function accentForIndex(index: number): string {
  const accents = [
    "linear-gradient(135deg, #2a0d0d 0%, #3d1a0a 60%, #1a0e08 100%)",
    "linear-gradient(135deg, #2a1d05 0%, #3d2a0a 60%, #150f05 100%)",
    "linear-gradient(135deg, #1f120a 0%, #2a1810 60%, #100806 100%)",
    "linear-gradient(135deg, #2a0808 0%, #3d0e0e 60%, #150404 100%)",
    "linear-gradient(135deg, #160a1f 0%, #251433 60%, #0a0610 100%)",
  ];
  return accents[index % accents.length];
}

function glyphForIndex(index: number): string {
  return ["🜂", "◐", "✦", "✚", "☾"][index % 5];
}

function mapPresetRow(row: PresetRow, index: number): PresetMix {
  const ingredients =
    row.preset_mix_ingredients
      ?.filter((item) => item.tobaccos)
      .filter((item) => {
        const brand = item.tobaccos?.tobacco_brands;
        const firstBrand = Array.isArray(brand) ? brand[0] : brand;
        return firstBrand?.is_active !== false;
      })
      .map((item) => ({
        percentage: item.percentage,
        tobacco: mapTobaccoRow(item.tobaccos!),
      })) ?? [];
  const strength =
    ingredients.length === 0
      ? 0
      : ingredients.reduce(
          (sum, item) => sum + item.tobacco.strength * item.percentage,
          0,
        ) / 100;

  return {
    id: row.id,
    name: row.name,
    desc: row.description ?? "Фірмовий мікс бару Сховище",
    strength: Math.round(strength),
    price: DEFAULT_PRICE_UAH,
    accent: accentForIndex(index),
    imageUrl: row.image_url,
    glyph: glyphForIndex(index),
    isSignature: row.is_signature,
    isMixOfDay: row.is_mix_of_day ?? false,
    isNew: row.is_new,
    ingredients,
    ratingAvg: row.rating_avg ?? 0,
    ratingCount: row.rating_count ?? 0,
  };
}

const PRESET_SELECT_WITH_MIX_OF_DAY =
  "id,name,description,image_url,is_signature,is_mix_of_day,is_new,sort_order,rating_avg,rating_count,preset_mix_ingredients(percentage,tobaccos(id,name,description,strength,smoke,color,image_url,in_stock,popularity,created_at,tobacco_brands(name,is_active),flavor_categories(name,slug,emoji)))";

const PRESET_SELECT_LEGACY =
  "id,name,description,image_url,is_signature,is_new,sort_order,preset_mix_ingredients(percentage,tobaccos(id,name,description,strength,smoke,color,image_url,in_stock,popularity,created_at,tobacco_brands(name),flavor_categories(name,slug,emoji)))";

export async function fetchPresetMixes(): Promise<PresetMix[]> {
  const supabase = createSupabaseBrowserClient();
  const result = await supabase
    .from("preset_mixes")
    .select(PRESET_SELECT_WITH_MIX_OF_DAY)
    .eq("is_active", true)
    .order("is_mix_of_day", { ascending: false })
    .order("sort_order", { ascending: true });

  const { data, error } = result.error
    ? await supabase
        .from("preset_mixes")
        .select(PRESET_SELECT_LEGACY)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
    : result;

  if (error) throw error;
  const mapped = (data as unknown as PresetRow[]).map(mapPresetRow);
  return mapped.length > 0 ? mapped : fallbackPresets();
}

export async function fetchPresetMix(id: string): Promise<PresetMix | null> {
  const supabase = createSupabaseBrowserClient();
  const result = await supabase
    .from("preset_mixes")
    .select(PRESET_SELECT_WITH_MIX_OF_DAY)
    .eq("is_active", true)
    .eq("id", id)
    .maybeSingle();

  const { data, error } = result.error
    ? await supabase
        .from("preset_mixes")
        .select(PRESET_SELECT_LEGACY)
        .eq("is_active", true)
        .eq("id", id)
        .maybeSingle()
    : result;

  if (error) throw error;
  if (!data) return fallbackPresetById(id);
  return mapPresetRow(data as unknown as PresetRow, 0);
}

// The guest's own star rating per preset mix (for hydrating the stars widget).
export async function fetchMyMixRatings(
  guestId: string | null,
): Promise<Map<string, number>> {
  if (!guestId) return new Map();
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("mix_ratings")
    .select("preset_mix_id,stars")
    .eq("guest_id", guestId);
  if (error) throw error;
  return new Map(data.map((row) => [row.preset_mix_id, row.stars]));
}

export async function rateMix(
  presetMixId: string,
  guestId: string,
  stars: number,
): Promise<{ stars: number; avg: number; count: number }> {
  const res = await fetch(`/api/presets/${presetMixId}/rate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guestId, stars }),
  });
  if (!res.ok) throw new Error("Не вдалося зберегти оцінку");
  return res.json();
}
