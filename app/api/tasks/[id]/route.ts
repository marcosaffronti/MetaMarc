import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        client:clients(id, name, company),
        campaign:campaigns(id, name),
        assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url),
        creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url)
      `)
      .eq("id", params.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Task GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const updateData: Record<string, any> = {};
    const allowedFields = [
      "title",
      "description",
      "priority",
      "status",
      "client_id",
      "campaign_id",
      "assigned_to",
      "due_date",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // If status changes to "completada", set completed_at
    if (updateData.status === "completada") {
      updateData.completed_at = new Date().toISOString();
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", params.id)
      .select(`
        *,
        client:clients(id, name, company),
        campaign:campaigns(id, name),
        assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url),
        creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url)
      `)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Task PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", params.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Task DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete task" },
      { status: 500 }
    );
  }
}
