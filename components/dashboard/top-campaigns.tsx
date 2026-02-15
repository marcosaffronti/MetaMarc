"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Campaign } from "@/types/database";
import { formatCurrency, formatCompactNumber, getStatusColor, getStatusLabel } from "@/lib/utils";

interface TopCampaignsProps {
  campaigns: (Campaign & {
    total_spend?: number;
    total_clicks?: number;
    total_impressions?: number;
  })[];
}

export function TopCampaigns({ campaigns }: TopCampaignsProps) {
  const maxSpend = Math.max(...campaigns.map((c) => c.total_spend || 0), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Campañas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay campañas activas
            </p>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.client?.company}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={getStatusColor(campaign.status)}
                  >
                    {getStatusLabel(campaign.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Inversión: {formatCurrency(campaign.total_spend || 0)}</span>
                  <span>Clicks: {formatCompactNumber(campaign.total_clicks || 0)}</span>
                  <span>Imp: {formatCompactNumber(campaign.total_impressions || 0)}</span>
                </div>
                <Progress
                  value={((campaign.total_spend || 0) / maxSpend) * 100}
                  className="h-2"
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
