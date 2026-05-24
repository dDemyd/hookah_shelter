import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { OrderStatus, ServiceType } from "@/lib/constants";

export type OrderIngredientView = {
  id: string;
  tobaccoId: string | null;
  percentage: number;
  tobacco: {
    brand: string;
    name: string;
    strength: number;
    category: string | null;
  };
};

export type OrderView = {
  id: string;
  shortCode: string;
  tableId: number | null;
  guestName: string | null;
  notes: string | null;
  status: OrderStatus;
  serviceType: ServiceType;
  price: number;
  statusChangedAt: string;
  createdAt: string;
  ingredients: OrderIngredientView[];
};

type OrderRow = {
  id: string;
  short_code: string;
  table_id: number | null;
  guest_name: string | null;
  notes: string | null;
  status: OrderStatus;
  service_type: ServiceType;
  price: number;
  status_changed_at: string;
  created_at: string;
  order_ingredients: {
    id: string;
    tobacco_id: string | null;
    percentage: number;
    tobacco_snapshot: {
      brand?: string;
      name?: string;
      strength?: number;
      category?: string | null;
    };
  }[];
};

const SELECT_COLS =
  "id,short_code,table_id,guest_name,notes,status,service_type,price,status_changed_at,created_at,order_ingredients(id,tobacco_id,percentage,tobacco_snapshot)";

function mapRow(row: OrderRow): OrderView {
  return {
    id: row.id,
    shortCode: row.short_code,
    tableId: row.table_id,
    guestName: row.guest_name,
    notes: row.notes,
    status: row.status,
    serviceType: row.service_type,
    price: row.price,
    statusChangedAt: row.status_changed_at,
    createdAt: row.created_at,
    ingredients: row.order_ingredients.map((ingredient) => ({
      id: ingredient.id,
      tobaccoId: ingredient.tobacco_id,
      percentage: ingredient.percentage,
      tobacco: {
        brand: ingredient.tobacco_snapshot.brand ?? "Без бренду",
        name: ingredient.tobacco_snapshot.name ?? "Тютюн",
        strength: ingredient.tobacco_snapshot.strength ?? 0,
        category: ingredient.tobacco_snapshot.category ?? null,
      },
    })),
  };
}

export async function fetchOrderByCode(code: string): Promise<OrderView | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("orders")
    .select(SELECT_COLS)
    .eq("short_code", code.toUpperCase())
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data as unknown as OrderRow);
}

/** Used by the /orders tab to render the user's submitted orders. */
export async function fetchOrdersByShortCodes(
  codes: string[],
): Promise<OrderView[]> {
  if (codes.length === 0) return [];
  const supabase = createSupabaseBrowserClient();
  const upper = codes.map((c) => c.toUpperCase());
  const { data, error } = await supabase
    .from("orders")
    .select(SELECT_COLS)
    .in("short_code", upper)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as OrderRow[]).map(mapRow);
}
