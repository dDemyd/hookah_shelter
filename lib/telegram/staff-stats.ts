import "server-only";
import { type OrderStatus } from "@/lib/constants";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const KYIV_TIME_ZONE = "Europe/Kyiv";
const ACTIVE_STATUSES = new Set<OrderStatus>(["accepted", "preparing", "ready"]);
const SERVED_STATUSES = new Set<OrderStatus>(["delivered", "closed"]);

type StaffProfileRow = {
  id: string;
  full_name: string;
  is_active: boolean;
  user_telegram_id: number | null;
};

type StaffOrderRow = {
  id: string;
  status: OrderStatus;
  price: number;
  accepted_by: string | null;
  created_at: string;
};

type StaffLeaderboardRow = {
  profileId: string;
  fullName: string;
  accepted: number;
  active: number;
  delivered: number;
  closed: number;
  cancelled: number;
  revenue: number;
};

type StaffShiftSnapshot = {
  label: string;
  totalOrders: number;
  acceptedOrders: number;
  unassignedOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  closedOrders: number;
  cancelledOrders: number;
  revenue: number;
  leaderboard: StaffLeaderboardRow[];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function timeZoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = timeZoneParts(date, timeZone);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return localAsUtc - date.getTime();
}

function zonedTimeToUtc(
  parts: { year: number; month: number; day: number; hour?: number; minute?: number; second?: number },
  timeZone: string,
): Date {
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0,
  );
  let utc = new Date(localAsUtc - timeZoneOffsetMs(new Date(localAsUtc), timeZone));
  utc = new Date(localAsUtc - timeZoneOffsetMs(utc, timeZone));
  return utc;
}

function todayRange() {
  const now = new Date();
  const today = timeZoneParts(now, KYIV_TIME_ZONE);
  const start = zonedTimeToUtc(
    { year: today.year, month: today.month, day: today.day },
    KYIV_TIME_ZONE,
  );
  const nextDayUtcGuess = new Date(Date.UTC(today.year, today.month - 1, today.day + 1));
  const nextDay = timeZoneParts(nextDayUtcGuess, "UTC");
  const end = zonedTimeToUtc(
    { year: nextDay.year, month: nextDay.month, day: nextDay.day },
    KYIV_TIME_ZONE,
  );
  const label = new Intl.DateTimeFormat("uk-UA", {
    timeZone: KYIV_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);

  return { startIso: start.toISOString(), endIso: end.toISOString(), label };
}

async function getLinkedActiveProfile(
  telegramUserId: number,
): Promise<StaffProfileRow | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("staff_profiles")
    .select("id,full_name,is_active,user_telegram_id")
    .eq("user_telegram_id", telegramUserId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return (data as StaffProfileRow | null) ?? null;
}

async function getTodaySnapshot(): Promise<StaffShiftSnapshot> {
  const supabase = createSupabaseServiceClient();
  const range = todayRange();
  const [profilesResult, ordersResult] = await Promise.all([
    supabase
      .from("staff_profiles")
      .select("id,full_name,is_active,user_telegram_id")
      .eq("is_active", true),
    supabase
      .from("orders")
      .select("id,status,price,accepted_by,created_at")
      .gte("created_at", range.startIso)
      .lt("created_at", range.endIso),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (ordersResult.error) throw ordersResult.error;

  const profiles = (profilesResult.data ?? []) as StaffProfileRow[];
  const orders = (ordersResult.data ?? []) as StaffOrderRow[];
  const statsByProfile = new Map<string, StaffLeaderboardRow>();

  for (const profile of profiles) {
    statsByProfile.set(profile.id, {
      profileId: profile.id,
      fullName: profile.full_name,
      accepted: 0,
      active: 0,
      delivered: 0,
      closed: 0,
      cancelled: 0,
      revenue: 0,
    });
  }

  let acceptedOrders = 0;
  let activeOrders = 0;
  let deliveredOrders = 0;
  let closedOrders = 0;
  let cancelledOrders = 0;
  let revenue = 0;

  for (const order of orders) {
    if (order.accepted_by) acceptedOrders += 1;
    if (ACTIVE_STATUSES.has(order.status)) activeOrders += 1;
    if (order.status === "delivered") deliveredOrders += 1;
    if (order.status === "closed") closedOrders += 1;
    if (order.status === "cancelled") cancelledOrders += 1;
    if (SERVED_STATUSES.has(order.status)) revenue += order.price;

    if (!order.accepted_by) continue;
    const staffStats = statsByProfile.get(order.accepted_by);
    if (!staffStats) continue;

    staffStats.accepted += 1;
    if (ACTIVE_STATUSES.has(order.status)) staffStats.active += 1;
    if (order.status === "delivered") staffStats.delivered += 1;
    if (order.status === "closed") staffStats.closed += 1;
    if (order.status === "cancelled") staffStats.cancelled += 1;
    if (SERVED_STATUSES.has(order.status)) staffStats.revenue += order.price;
  }

  const leaderboard = [...statsByProfile.values()]
    .filter((row) => row.accepted > 0)
    .sort(
      (a, b) =>
        b.accepted - a.accepted ||
        b.closed - a.closed ||
        b.delivered - a.delivered ||
        b.revenue - a.revenue ||
        a.fullName.localeCompare(b.fullName, "uk"),
    );

  return {
    label: range.label,
    totalOrders: orders.length,
    acceptedOrders,
    unassignedOrders: orders.length - acceptedOrders,
    activeOrders,
    deliveredOrders,
    closedOrders,
    cancelledOrders,
    revenue,
    leaderboard,
  };
}

function missingLinkText(): string {
  return "Я не бачу привʼязки до співробітника. Надішли email адмінки або <code>/link email@example.com</code>.";
}

export async function formatPersonalStats(telegramUserId: number): Promise<string> {
  const profile = await getLinkedActiveProfile(telegramUserId);
  if (!profile) return missingLinkText();

  const snapshot = await getTodaySnapshot();
  const row = snapshot.leaderboard.find((item) => item.profileId === profile.id) ?? {
    profileId: profile.id,
    fullName: profile.full_name,
    accepted: 0,
    active: 0,
    delivered: 0,
    closed: 0,
    cancelled: 0,
    revenue: 0,
  };

  return [
    `👤 <b>${escapeHtml(profile.full_name)}</b> · ${escapeHtml(snapshot.label)}`,
    `Прийнято: <b>${row.accepted}</b>`,
    `В роботі: <b>${row.active}</b>`,
    `Видано: <b>${row.delivered}</b>`,
    `Закрито: <b>${row.closed}</b>`,
    `Скасовано: <b>${row.cancelled}</b>`,
    `Дохід: <b>${row.revenue} ₴</b>`,
  ].join("\n");
}

export async function formatShiftStats(telegramUserId: number): Promise<string> {
  const profile = await getLinkedActiveProfile(telegramUserId);
  if (!profile) return missingLinkText();

  const snapshot = await getTodaySnapshot();
  return [
    `📊 <b>Зміна за сьогодні</b> · ${escapeHtml(snapshot.label)}`,
    `Замовлень: <b>${snapshot.totalOrders}</b>`,
    `Прийнято командою: <b>${snapshot.acceptedOrders}</b>`,
    `Без відповідального: <b>${snapshot.unassignedOrders}</b>`,
    `В роботі: <b>${snapshot.activeOrders}</b>`,
    `Видано: <b>${snapshot.deliveredOrders}</b>`,
    `Закрито: <b>${snapshot.closedOrders}</b>`,
    `Скасовано: <b>${snapshot.cancelledOrders}</b>`,
    `Дохід: <b>${snapshot.revenue} ₴</b>`,
  ].join("\n");
}

export async function formatLeaderboard(telegramUserId: number): Promise<string> {
  const profile = await getLinkedActiveProfile(telegramUserId);
  if (!profile) return missingLinkText();

  const snapshot = await getTodaySnapshot();
  if (snapshot.leaderboard.length === 0) {
    return `🏆 <b>Рейтинг за сьогодні</b> · ${escapeHtml(snapshot.label)}\nПоки немає прийнятих замовлень.`;
  }

  const rows = snapshot.leaderboard.slice(0, 10).map((row, index) => {
    const place = index + 1;
    return [
      `${place}. <b>${escapeHtml(row.fullName)}</b> — ${row.accepted}`,
      `   видано ${row.delivered} · закрито ${row.closed} · ${row.revenue} ₴`,
    ].join("\n");
  });

  return [
    `🏆 <b>Рейтинг за сьогодні</b> · ${escapeHtml(snapshot.label)}`,
    ...rows,
  ].join("\n");
}
