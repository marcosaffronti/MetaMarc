import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("clients")
      .select("*, assigned_user:profiles!clients_assigned_to_fkey(id, full_name, email, avatar_url)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Clients GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const {
      name,
      company,
      email,
      phone,
      website,
      meta_account_id,
      meta_pixel_id,
      assigned_to,
      notes,
      monthly_budget,
      is_active,
    } = body;

    if (!name || !company || !email) {
      return NextResponse.json(
        { error: "name, company, and email are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("clients")
      .insert({
        name,
        company,
        email,
        phone: phone || null,
        website: website || null,
        meta_account_id: meta_account_id || null,
        meta_pixel_id: meta_pixel_id || null,
        assigned_to: assigned_to || null,
        notes: notes || null,
        monthly_budget: monthly_budget || null,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select("*, assigned_user:profiles!clients_assigned_to_fkey(id, full_name, email, avatar_url)")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("Clients POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create client" },
      { status: 500 }
    );
  }
}
