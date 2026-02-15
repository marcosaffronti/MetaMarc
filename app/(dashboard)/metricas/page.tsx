"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Campaign, CampaignMetric, Client } from "@/types/database";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  formatCurrency,
  formatCompactNumber,
  formatPercent,
} from "@/lib/utils";
import {
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  TrendingUp,
  Percent,
} from "lucide-react";

const COLORS = ["#1877F2", "#42A5F5", "#1565C0", "#90CAF9", "#0D47A1", "#64B5F6"];

export default function MetricasPage() {
  const supabase = createClient();

  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetric[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("todos");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("todas");
  const [dateRange, setDateRange] = useState<string>("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, name, company")
        .eq("is_active", true)
        .order("company");
      if (clientsData) setClients(clientsData as any);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchCampaigns = async () => {
      let query = supabase.from("campaigns").select("id, name, client_id").order("name");
      if (selectedClient !== "todos") {
        query = query.eq("client_id", selectedClient);
      }
      const { data } = await query;
      if (data) setCampaigns(data as any);
    };
    fetchCampaigns();
    setSelectedCampaign("todas");
  }, [selectedClient]);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      const since = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      let query = supabase
        .from("campaign_metrics")
        .select("*, campaign:campaigns(id, name, client_id)")
        .gte("date", since)
        .order("date");

      if (selectedCampaign !== "todas") {
        query = query.eq("campaign_id", selectedCampaign);
      }

      const { data } = await query;

      let filteredData = data || [];
      if (selectedClient !== "todos" && selectedCampaign === "todas") {
        filteredData = filteredData.filter(
          (m: any) => m.campaign?.client_id === selectedClient
        );
      }

      setMetrics(filteredData as any);
      setLoading(false);
    };
    fetchMetrics();
  }, [selectedClient, selectedCampaign, dateRange]);

  // Aggregate metrics
  const totals = metrics.reduce(
    (acc, m) => ({
      spend: acc.spend + Number(m.spend),
      impressions: acc.impressions + Number(m.impressions),
      clicks: acc.clicks + Number(m.clicks),
      conversions: acc.conversions + Number(m.conversions),
      reach: acc.reach + Number(m.reach),
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, reach: 0 }
  );

  const avgCPC = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const avgCTR = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  // Daily aggregation for charts
  const dailyData: Record<string, any> = {};
  metrics.forEach((m) => {
    if (!dailyData[m.date]) {
      dailyData[m.date] = {
        date: new Date(m.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" }),
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
      };
    }
    dailyData[m.date].spend += Number(m.spend);
    dailyData[m.date].impressions += Number(m.impressions);
    dailyData[m.date].clicks += Number(m.clicks);
    dailyData[m.date].conversions += Number(m.conversions);
  });
  const chartData = Object.values(dailyData);

  // Campaign breakdown for pie chart
  const campaignBreakdown: Record<string, { name: string; spend: number }> = {};
  metrics.forEach((m: any) => {
    const campaignName = m.campaign?.name || "Desconocida";
    if (!campaignBreakdown[m.campaign_id]) {
      campaignBreakdown[m.campaign_id] = { name: campaignName, spend: 0 };
    }
    campaignBreakdown[m.campaign_id].spend += Number(m.spend);
  });
  const pieData = Object.values(campaignBreakdown).sort((a, b) => b.spend - a.spend).slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Métricas</h1>
        <p className="text-muted-foreground">
          Analiza el rendimiento de tus campañas de Meta Ads
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los clientes</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Campaña" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las campañas</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="14">Últimos 14 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="60">Últimos 60 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard title="Inversión Total" value={formatCurrency(totals.spend)} icon={DollarSign} />
            <MetricCard title="Impresiones" value={formatCompactNumber(totals.impressions)} icon={Eye} />
            <MetricCard title="Clicks" value={formatCompactNumber(totals.clicks)} icon={MousePointerClick} />
            <MetricCard title="Conversiones" value={totals.conversions.toString()} icon={Target} />
            <MetricCard title="CPC Promedio" value={formatCurrency(avgCPC)} icon={TrendingUp} />
            <MetricCard title="CTR Promedio" value={formatPercent(avgCTR)} icon={Percent} />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Inversión Diaria</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSpendM" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1877F2" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `$${formatCompactNumber(v)}`} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), "Inversión"]} />
                    <Area type="monotone" dataKey="spend" stroke="#1877F2" fillOpacity={1} fill="url(#colorSpendM)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inversión por Campaña</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px]">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="spend"
                        nameKey="name"
                        label={(entry) => entry.name.substring(0, 15)}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No hay datos disponibles
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Clicks vs Conversiones</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="clicks" name="Clicks" fill="#42A5F5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="conversions" name="Conversiones" fill="#1565C0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impresiones</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#42A5F5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#42A5F5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => formatCompactNumber(v)} />
                    <Tooltip formatter={(v: number) => [formatCompactNumber(v), "Impresiones"]} />
                    <Area type="monotone" dataKey="impressions" stroke="#42A5F5" fillOpacity={1} fill="url(#colorImp)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
