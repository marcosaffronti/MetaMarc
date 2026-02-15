const META_GRAPH_API_BASE = "https://graph.facebook.com/v18.0";

interface MetaAdAccount {
  name: string;
  account_id: string;
  account_status: number;
  currency: string;
  balance: string;
  id: string;
}

interface MetaCampaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

interface MetaCampaignInsight {
  impressions: string;
  clicks: string;
  conversions?: string;
  spend: string;
  cpc: string;
  ctr: string;
  cpm: string;
  reach: string;
  frequency: string;
  date_start: string;
  date_stop: string;
}

interface MetaApiResponse<T> {
  data: T[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export class MetaAdsClient {
  private accessToken: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || process.env.META_ACCESS_TOKEN || "";
    if (!this.accessToken) {
      throw new Error("Meta access token is required. Provide it in the constructor or set META_ACCESS_TOKEN env var.");
    }
  }

  private async fetchFromMeta<T>(endpoint: string, params: Record<string, string> = {}): Promise<MetaApiResponse<T>> {
    const url = new URL(`${META_GRAPH_API_BASE}/${endpoint}`);
    url.searchParams.set("access_token", this.accessToken);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Meta API Error: ${data.error.message} (code: ${data.error.code}, type: ${data.error.type})`);
    }

    if (!response.ok) {
      throw new Error(`Meta API request failed with status ${response.status}`);
    }

    return data;
  }

  async getAdAccounts(): Promise<MetaAdAccount[]> {
    const response = await this.fetchFromMeta<MetaAdAccount>("me/adaccounts", {
      fields: "name,account_id,account_status,currency,balance",
    });

    return response.data;
  }

  async getCampaigns(accountId: string): Promise<MetaCampaign[]> {
    const formattedId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;

    const response = await this.fetchFromMeta<MetaCampaign>(`${formattedId}/campaigns`, {
      fields: "name,objective,status,daily_budget,lifetime_budget,start_time,stop_time",
    });

    return response.data;
  }

  async getCampaignInsights(
    campaignId: string,
    dateRange: { since: string; until: string }
  ): Promise<MetaCampaignInsight[]> {
    const response = await this.fetchFromMeta<MetaCampaignInsight>(`${campaignId}/insights`, {
      fields: "impressions,clicks,conversions,spend,cpc,ctr,cpm,reach,frequency",
      time_range: JSON.stringify({ since: dateRange.since, until: dateRange.until }),
      time_increment: "1",
    });

    return response.data;
  }

  async syncCampaignData(accountId: string, supabase: any, clientId: string): Promise<{
    campaignsSynced: number;
    metricsSynced: number;
    errors: string[];
  }> {
    const results = {
      campaignsSynced: 0,
      metricsSynced: 0,
      errors: [] as string[],
    };

    try {
      // Fetch all campaigns from Meta
      const metaCampaigns = await this.getCampaigns(accountId);

      // Calculate date range for insights (last 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dateRange = {
        since: thirtyDaysAgo.toISOString().split("T")[0],
        until: now.toISOString().split("T")[0],
      };

      for (const metaCampaign of metaCampaigns) {
        try {
          // Map Meta status to local status
          const statusMap: Record<string, string> = {
            ACTIVE: "activa",
            PAUSED: "pausada",
            DELETED: "finalizada",
            ARCHIVED: "finalizada",
          };

          // Upsert campaign into Supabase
          const campaignData = {
            client_id: clientId,
            meta_campaign_id: metaCampaign.id,
            name: metaCampaign.name,
            objective: metaCampaign.objective || null,
            status: statusMap[metaCampaign.status] || "borrador",
            daily_budget: metaCampaign.daily_budget
              ? parseFloat(metaCampaign.daily_budget) / 100
              : null,
            lifetime_budget: metaCampaign.lifetime_budget
              ? parseFloat(metaCampaign.lifetime_budget) / 100
              : null,
            start_date: metaCampaign.start_time || null,
            end_date: metaCampaign.stop_time || null,
            updated_at: new Date().toISOString(),
          };

          const { data: campaign, error: campaignError } = await supabase
            .from("campaigns")
            .upsert(campaignData, {
              onConflict: "meta_campaign_id",
            })
            .select()
            .single();

          if (campaignError) {
            results.errors.push(`Campaign ${metaCampaign.name}: ${campaignError.message}`);
            continue;
          }

          results.campaignsSynced++;

          // Fetch and sync insights for this campaign
          try {
            const insights = await this.getCampaignInsights(metaCampaign.id, dateRange);

            for (const insight of insights) {
              const metricData = {
                campaign_id: campaign.id,
                date: insight.date_start,
                impressions: parseInt(insight.impressions) || 0,
                clicks: parseInt(insight.clicks) || 0,
                conversions: insight.conversions ? parseInt(insight.conversions) : 0,
                spend: parseFloat(insight.spend) || 0,
                cpc: parseFloat(insight.cpc) || 0,
                ctr: parseFloat(insight.ctr) || 0,
                cpm: parseFloat(insight.cpm) || 0,
                reach: parseInt(insight.reach) || 0,
                frequency: parseFloat(insight.frequency) || 0,
              };

              const { error: metricError } = await supabase
                .from("campaign_metrics")
                .upsert(metricData, {
                  onConflict: "campaign_id,date",
                });

              if (metricError) {
                results.errors.push(
                  `Metric for ${metaCampaign.name} on ${insight.date_start}: ${metricError.message}`
                );
              } else {
                results.metricsSynced++;
              }
            }
          } catch (insightError: any) {
            results.errors.push(
              `Insights for ${metaCampaign.name}: ${insightError.message}`
            );
          }
        } catch (campaignError: any) {
          results.errors.push(
            `Processing ${metaCampaign.name}: ${campaignError.message}`
          );
        }
      }
    } catch (error: any) {
      results.errors.push(`Failed to fetch campaigns: ${error.message}`);
    }

    return results;
  }
}
