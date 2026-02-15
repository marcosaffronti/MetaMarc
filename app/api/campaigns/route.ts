import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");

    let query = supabase
      .from("campaigns")
      .select("*, client:clients(id, name, company), metrics:campaign_metrics(*)")
      .order("created_at", { ascending: false });

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Campaigns GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const {
      client_id,
      name,
      objective,
      status,
      daily_budget,
      lifetime_budget,
      start_date,
      end_date,
    } = body;

    if (!client_id || !name) {
      return NextResponse.json(
        { error: "client_id and name are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        client_id,
        name,
        objective: objective || null,
        status: status || "borrador",
        daily_budget: daily_budget || null,
        lifetime_budget: lifetime_budget || null,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("Campaigns POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create campaign" },
      { status: 500 }
    );
  }
}
