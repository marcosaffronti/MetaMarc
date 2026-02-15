export type UserRole = "admin" | "usuario" | "cliente";

export type TaskPriority = "baja" | "media" | "alta" | "urgente";

export type TaskStatus = "pendiente" | "en_progreso" | "completada" | "cancelada";

export type CampaignStatus = "activa" | "pausada" | "finalizada" | "borrador";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  website: string | null;
  meta_account_id: string | null;
  meta_pixel_id: string | null;
  assigned_to: string | null;
  notes: string | null;
  monthly_budget: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  assigned_user?: Profile;
}

export interface Campaign {
  id: string;
  client_id: string;
  meta_campaign_id: string | null;
  name: string;
  objective: string | null;
  status: CampaignStatus;
  daily_budget: number | null;
  lifetime_budget: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  metrics?: CampaignMetric[];
}

export interface CampaignMetric {
  id: string;
  campaign_id: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  cpc: number;
  ctr: number;
  cpm: number;
  reach: number;
  frequency: number;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  client_id: string | null;
  campaign_id: string | null;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  campaign?: Campaign;
  assigned_user?: Profile;
  creator?: Profile;
}

export interface DashboardMetrics {
  total_clients: number;
  active_campaigns: number;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  avg_cpc: number;
  avg_ctr: number;
  pending_tasks: number;
}

export interface MetricsByDate {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Client, "id" | "created_at">>;
      };
      campaigns: {
        Row: Campaign;
        Insert: Omit<Campaign, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Campaign, "id" | "created_at">>;
      };
      campaign_metrics: {
        Row: CampaignMetric;
        Insert: Omit<CampaignMetric, "id" | "created_at">;
        Update: Partial<Omit<CampaignMetric, "id" | "created_at">>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Task, "id" | "created_at">>;
      };
    };
  };
}
