import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const assignedTo = searchParams.get("assigned_to");
    const clientId = searchParams.get("client_id");

    let query = supabase
      .from("tasks")
      .select(`
        *,
        client:clients(id, name, company),
        campaign:campaigns(id, name),
        assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url),
        creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url)
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (assignedTo) {
      query = query.eq("assigned_to", assignedTo);
    }

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
    console.error("Tasks GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const {
      title,
      description,
      priority,
      status,
      client_id,
      campaign_id,
      assigned_to,
      created_by,
      due_date,
    } = body;

    if (!title || !created_by) {
      return NextResponse.json(
        { error: "title and created_by are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title,
        description: description || null,
        priority: priority || "media",
        status: status || "pendiente",
        client_id: client_id || null,
        campaign_id: campaign_id || null,
        assigned_to: assigned_to || null,
        created_by,
        due_date: due_date || null,
        completed_at: null,
      })
      .select(`
        *,
        client:clients(id, name, company),
        campaign:campaigns(id, name),
        assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url),
        creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url)
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("Tasks POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}
