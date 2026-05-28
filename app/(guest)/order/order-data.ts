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
  guestId: string | null;
  tableId: number | null;
  guestName: string | null;
  notes: string | null;
  status: OrderStatus;
  serviceType: ServiceType;
  price: number;
  isOverpack: boolean;
  coolIntensity: number;
  depositAmount: number;
  statusChangedAt: string;
  createdAt: string;
  ingredients: OrderIngredientView[];
};

type OrderRow = {
  id: string;
  short_code: string;
  guest_id: string | null;
  table_id: number | null;
  guest_name: string | null;
  notes: string | null;
  status: OrderStatus;
  service_type: ServiceType;
  price: number;
  is_overpack: boolean;
  cool_intensity: number;
  deposit_amount: number;
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
  "id,short_code,guest_id,table_id,guest_name,notes,status,service_type,price,is_overpack,cool_intensity,deposit_amount,status_changed_at,created_at,order_ingredients(id,tobacco_id,percentage,tobacco_snapshot)";

function mapRow(row: OrderRow): OrderView {
  return {
    id: row.id,
    shortCode: row.short_code,
    guestId: row.guest_id,
    tableId: row.table_id,
    guestName: row.guest_name,
    notes: row.notes,
    status: row.status,
    serviceType: row.service_type,
    price: row.price,
    isOverpack: row.is_overpack,
    coolIntensity: row.cool_intensity,
    depositAmount: row.deposit_amount,
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

export type OrderReview = {
  rating: number;
  comment: string | null;
};

export async function fetchOrderReview(
  orderId: string,
): Promise<OrderReview | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("order_reviews")
    .select("rating,comment")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function submitOrderReview(
  orderId: string,
  guestId: string,
  rating: number,
  comment: string,
): Promise<OrderReview> {
  const res = await fetch(`/api/orders/${orderId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guestId, rating, comment }),
  });
  if (!res.ok) throw new Error("Не вдалося надіслати відгук");
  return res.json();
}
