import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardMetrics } from "@/types/database";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sinceDate = thirtyDaysAgo.toISOString().split("T")[0];

    // Run all queries in parallel for performance
    const [
      clientsResult,
      campaignsResult,
      metricsResult,
      tasksResult,
    ] = await Promise.all([
      // Total clients count
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),

      // Active campaigns count
      supabase
        .from("campaigns")
        .select("id", { count: "exact", head: true })
        .eq("status", "activa"),

      // Sum of recent campaign_metrics (last 30 days)
      supabase
        .from("campaign_metrics")
        .select("impressions, clicks, conversions, spend, cpc, ctr")
        .gte("date", sinceDate),

      // Pending tasks count
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("status", "pendiente"),
    ]);

    // Calculate aggregated metrics
    const metrics = metricsResult.data || [];
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;

    for (const metric of metrics) {
      totalSpend += metric.spend || 0;
      totalImpressions += metric.impressions || 0;
      totalClicks += metric.clicks || 0;
      totalConversions += metric.conversions || 0;
    }

    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    const dashboardMetrics: DashboardMetrics = {
      total_clients: clientsResult.count || 0,
      active_campaigns: campaignsResult.count || 0,
      total_spend: Math.round(totalSpend * 100) / 100,
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      total_conversions: totalConversions,
      avg_cpc: Math.round(avgCpc * 100) / 100,
      avg_ctr: Math.round(avgCtr * 100) / 100,
      pending_tasks: tasksResult.count || 0,
    };

    return NextResponse.json({ data: dashboardMetrics });
  } catch (error: any) {
    console.error("Dashboard GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}
