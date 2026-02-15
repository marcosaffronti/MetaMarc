"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { MetricsByDate } from "@/types/database";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";

interface MetricsChartProps {
  data: MetricsByDate[];
}

export function MetricsChart({ data }: MetricsChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
    }),
  }));

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Rendimiento de Campañas</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="spend" className="space-y-4">
          <TabsList>
            <TabsTrigger value="spend">Inversión</TabsTrigger>
            <TabsTrigger value="impressions">Impresiones</TabsTrigger>
            <TabsTrigger value="clicks">Clicks</TabsTrigger>
            <TabsTrigger value="conversions">Conversiones</TabsTrigger>
          </TabsList>

          <TabsContent value="spend" className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedData}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1877F2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `$${formatCompactNumber(v)}`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Inversión"]}
                  labelClassName="font-medium"
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="#1877F2"
                  fillOpacity={1}
                  fill="url(#colorSpend)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="impressions" className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => formatCompactNumber(v)} />
                <Tooltip
                  formatter={(value: number) => [formatCompactNumber(value), "Impresiones"]}
                />
                <Bar dataKey="impressions" fill="#1877F2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="clicks" className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedData}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#42A5F5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#42A5F5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => formatCompactNumber(v)} />
                <Tooltip
                  formatter={(value: number) => [formatCompactNumber(value), "Clicks"]}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#42A5F5"
                  fillOpacity={1}
                  fill="url(#colorClicks)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="conversions" className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  formatter={(value: number) => [value, "Conversiones"]}
                />
                <Legend />
                <Bar dataKey="conversions" name="Conversiones" fill="#1565C0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
