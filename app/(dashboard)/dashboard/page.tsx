"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MetricsChart } from "@/components/dashboard/metrics-chart";
import { RecentTasks } from "@/components/dashboard/recent-tasks";
import { TopCampaigns } from "@/components/dashboard/top-campaigns";
import { DashboardMetrics, MetricsByDate, Task, Campaign } from "@/types/database";
import {
  formatCurrency,
  formatCompactNumber,
  formatPercent,
} from "@/lib/utils";
import {
  Users,
  Megaphone,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  TrendingUp,
  CheckSquare,
} from "lucide-react";

export default function DashboardPage() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<MetricsByDate[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [topCampaigns, setTopCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch metrics summary
        const [clientsRes, campaignsRes, metricsRes, tasksRes] = await Promise.all([
          supabase.from("clients").select("id", { count: "exact" }).eq("is_active", true),
          supabase.from("campaigns").select("id", { count: "exact" }).eq("status", "activa"),
          supabase.from("campaign_metrics").select("*").gte(
            "date",
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          ),
          supabase
            .from("tasks")
            .select("*, client:clients(id, name, company), assigned_user:profiles!tasks_assigned_to_fkey(id, full_name)")
            .in("status", ["pendiente", "en_progreso"])
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        const metricsData = metricsRes.data || [];
        const totalSpend = metricsData.reduce((sum, m) => sum + Number(m.spend), 0);
        const totalImpressions = metricsData.reduce((sum, m) => sum + Number(m.impressions), 0);
        const totalClicks = metricsData.reduce((sum, m) => sum + Number(m.clicks), 0);
        const totalConversions = metricsData.reduce((sum, m) => sum + Number(m.conversions), 0);

        setMetrics({
          total_clients: clientsRes.count || 0,
          active_campaigns: campaignsRes.count || 0,
          total_spend: totalSpend,
          total_impressions: totalImpressions,
          total_clicks: totalClicks,
          total_conversions: totalConversions,
          avg_cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
          avg_ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
          pending_tasks: tasksRes.data?.length || 0,
        });

        setRecentTasks((tasksRes.data as any) || []);

        // Chart data - aggregate by date
        const byDate: Record<string, MetricsByDate> = {};
        metricsData.forEach((m) => {
          if (!byDate[m.date]) {
            byDate[m.date] = { date: m.date, impressions: 0, clicks: 0, conversions: 0, spend: 0 };
          }
          byDate[m.date].impressions += Number(m.impressions);
          byDate[m.date].clicks += Number(m.clicks);
          byDate[m.date].conversions += Number(m.conversions);
          byDate[m.date].spend += Number(m.spend);
        });
        setChartData(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)));

        // Top campaigns
        const { data: campaigns } = await supabase
          .from("campaigns")
          .select("*, client:clients(id, name, company)")
          .eq("status", "activa")
          .limit(5);

        if (campaigns) {
          const campaignsWithMetrics = await Promise.all(
            campaigns.map(async (campaign) => {
              const { data: cMetrics } = await supabase
                .from("campaign_metrics")
                .select("spend, clicks, impressions")
                .eq("campaign_id", campaign.id)
                .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

              const total_spend = (cMetrics || []).reduce((s, m) => s + Number(m.spend), 0);
              const total_clicks = (cMetrics || []).reduce((s, m) => s + Number(m.clicks), 0);
              const total_impressions = (cMetrics || []).reduce((s, m) => s + Number(m.impressions), 0);

              return { ...campaign, total_spend, total_clicks, total_impressions };
            })
          );
          setTopCampaigns(campaignsWithMetrics.sort((a, b) => b.total_spend - a.total_spend));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido, {profile?.full_name || "Usuario"}. Aquí tienes un resumen de tus campañas.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Clientes Activos"
          value={metrics?.total_clients.toString() || "0"}
          icon={Users}
          description="clientes en total"
        />
        <MetricCard
          title="Campañas Activas"
          value={metrics?.active_campaigns.toString() || "0"}
          icon={Megaphone}
          description="campañas corriendo"
        />
        <MetricCard
          title="Inversión (30d)"
          value={formatCurrency(metrics?.total_spend || 0)}
          icon={DollarSign}
          description="últimos 30 días"
        />
        <MetricCard
          title="Conversiones"
          value={formatCompactNumber(metrics?.total_conversions || 0)}
          icon={Target}
          description="últimos 30 días"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Impresiones"
          value={formatCompactNumber(metrics?.total_impressions || 0)}
          icon={Eye}
        />
        <MetricCard
          title="Clicks"
          value={formatCompactNumber(metrics?.total_clicks || 0)}
          icon={MousePointerClick}
        />
        <MetricCard
          title="CPC Promedio"
          value={formatCurrency(metrics?.avg_cpc || 0)}
          icon={TrendingUp}
        />
        <MetricCard
          title="CTR Promedio"
          value={formatPercent(metrics?.avg_ctr || 0)}
          icon={CheckSquare}
        />
      </div>

      {/* Chart */}
      <MetricsChart data={chartData} />

      {/* Bottom Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <TopCampaigns campaigns={topCampaigns} />
        <RecentTasks tasks={recentTasks} />
      </div>
    </div>
  );
}
