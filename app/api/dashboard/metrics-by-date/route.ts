import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MetricsByDate } from "@/types/database";

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    // Calculate the start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const sinceDate = startDate.toISOString().split("T")[0];

    // Fetch all metrics within the date range
    const { data: metrics, error } = await supabase
      .from("campaign_metrics")
      .select("date, impressions, clicks, conversions, spend")
      .gte("date", sinceDate)
      .order("date", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Aggregate metrics by date
    const metricsByDateMap = new Map<string, MetricsByDate>();

    for (const metric of metrics || []) {
      const existing = metricsByDateMap.get(metric.date);

      if (existing) {
        existing.impressions += metric.impressions || 0;
        existing.clicks += metric.clicks || 0;
        existing.conversions += metric.conversions || 0;
        existing.spend += metric.spend || 0;
      } else {
        metricsByDateMap.set(metric.date, {
          date: metric.date,
          impressions: metric.impressions || 0,
          clicks: metric.clicks || 0,
          conversions: metric.conversions || 0,
          spend: metric.spend || 0,
        });
      }
    }

    // Convert map to sorted array
    const metricsByDate: MetricsByDate[] = Array.from(metricsByDateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((m) => ({
        ...m,
        spend: Math.round(m.spend * 100) / 100,
      }));

    return NextResponse.json({ data: metricsByDate });
  } catch (error: any) {
    console.error("Metrics by date GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch metrics by date" },
      { status: 500 }
    );
  }
}
