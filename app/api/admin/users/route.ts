import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type StaffRole = "admin" | "kalyanchik";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const service = createSupabaseServiceClient();
  const { data: profile, error: profileError } = await service
    .from("staff_profiles")
    .select("role,is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin" || !profile.is_active) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { service };
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const [{ data: usersData, error: usersError }, { data: profiles, error: profilesError }] = await Promise.all([
    auth.service.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    auth.service.from("staff_profiles").select("id,full_name,role,telegram_chat_id,is_active,created_at"),
  ]);

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const users = usersData.users.map((user) => {
    const profile = profilesById.get(user.id);
    return {
      id: user.id,
      email: user.email ?? "",
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      full_name: profile?.full_name ?? user.email ?? "",
      role: profile?.role ?? null,
      is_active: profile?.is_active ?? false,
      has_profile: Boolean(profile),
    };
  });

  return NextResponse.json({ users });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    id?: string;
    full_name?: string;
    role?: StaffRole;
    is_active?: boolean;
  };

  if (!body.id || !body.full_name?.trim() || !body.role) {
    return NextResponse.json({ error: "id, full_name and role are required" }, { status: 400 });
  }

  const { error } = await auth.service.from("staff_profiles").upsert({
    id: body.id,
    full_name: body.full_name.trim(),
    role: body.role,
    is_active: body.is_active ?? true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
