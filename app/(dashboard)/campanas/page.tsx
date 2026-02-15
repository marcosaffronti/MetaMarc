"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Campaign, Client } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Megaphone,
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw,
  Calendar,
  DollarSign,
} from "lucide-react";
import {
  formatCurrency,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils";

export default function CampanasPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  const [campaigns, setCampaigns] = useState<(Campaign & { client?: Client })[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const [formData, setFormData] = useState({
    client_id: "",
    name: "",
    objective: "",
    status: "borrador",
    daily_budget: "",
    lifetime_budget: "",
    start_date: "",
    end_date: "",
    meta_campaign_id: "",
  });

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*, client:clients(id, name, company)")
      .order("created_at", { ascending: false });

    if (!error && data) setCampaigns(data as any);
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, name, company, meta_account_id")
      .eq("is_active", true)
      .order("company");
    if (data) setClients(data as any);
  };

  useEffect(() => {
    fetchCampaigns();
    fetchClients();
  }, []);

  const resetForm = () => {
    setFormData({
      client_id: "",
      name: "",
      objective: "",
      status: "borrador",
      daily_budget: "",
      lifetime_budget: "",
      start_date: "",
      end_date: "",
      meta_campaign_id: "",
    });
    setEditingCampaign(null);
  };

  const handleSubmit = async () => {
    if (!formData.client_id || !formData.name) {
      toast({ title: "Error", description: "Cliente y nombre son obligatorios", variant: "destructive" });
      return;
    }

    const payload = {
      client_id: formData.client_id,
      name: formData.name,
      objective: formData.objective || null,
      status: formData.status,
      daily_budget: formData.daily_budget ? parseFloat(formData.daily_budget) : null,
      lifetime_budget: formData.lifetime_budget ? parseFloat(formData.lifetime_budget) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      meta_campaign_id: formData.meta_campaign_id || null,
    };

    if (editingCampaign) {
      const { error } = await supabase
        .from("campaigns")
        .update(payload)
        .eq("id", editingCampaign.id);

      if (error) {
        toast({ title: "Error", description: "No se pudo actualizar la campaña", variant: "destructive" });
        return;
      }
      toast({ title: "Campaña actualizada" });
    } else {
      const { error } = await supabase.from("campaigns").insert(payload);
      if (error) {
        toast({ title: "Error", description: "No se pudo crear la campaña", variant: "destructive" });
        return;
      }
      toast({ title: "Campaña creada exitosamente" });
    }

    setDialogOpen(false);
    resetForm();
    fetchCampaigns();
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      client_id: campaign.client_id,
      name: campaign.name,
      objective: campaign.objective || "",
      status: campaign.status,
      daily_budget: campaign.daily_budget?.toString() || "",
      lifetime_budget: campaign.lifetime_budget?.toString() || "",
      start_date: campaign.start_date || "",
      end_date: campaign.end_date || "",
      meta_campaign_id: campaign.meta_campaign_id || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar la campaña", variant: "destructive" });
      return;
    }
    toast({ title: "Campaña eliminada" });
    fetchCampaigns();
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const clientsWithMeta = clients.filter((c) => c.meta_account_id);
      for (const client of clientsWithMeta) {
        await fetch("/api/meta-ads/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: client.id,
            meta_account_id: client.meta_account_id,
          }),
        });
      }
      toast({ title: "Sincronización completada" });
      fetchCampaigns();
    } catch {
      toast({ title: "Error", description: "Error al sincronizar", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.client?.company?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "todas" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campañas</h1>
          <p className="text-muted-foreground">
            Gestiona y sincroniza tus campañas de Meta Ads
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncAll} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Sincronizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="meta">
                <Plus className="mr-2 h-4 w-4" /> Nueva Campaña
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCampaign ? "Editar Campaña" : "Nueva Campaña"}
                </DialogTitle>
                <DialogDescription>
                  {editingCampaign
                    ? "Modifica los datos de la campaña"
                    : "Crea una nueva campaña para un cliente"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(v) => setFormData({ ...formData, client_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Campaña de Conversiones Q1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Objetivo</Label>
                    <Select
                      value={formData.objective}
                      onValueChange={(v) => setFormData({ ...formData, objective: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar objetivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONVERSIONS">Conversiones</SelectItem>
                        <SelectItem value="TRAFFIC">Tráfico</SelectItem>
                        <SelectItem value="REACH">Alcance</SelectItem>
                        <SelectItem value="ENGAGEMENT">Interacción</SelectItem>
                        <SelectItem value="LEADS">Leads</SelectItem>
                        <SelectItem value="BRAND_AWARENESS">Reconocimiento</SelectItem>
                        <SelectItem value="VIDEO_VIEWS">Vistas de Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="borrador">Borrador</SelectItem>
                        <SelectItem value="activa">Activa</SelectItem>
                        <SelectItem value="pausada">Pausada</SelectItem>
                        <SelectItem value="finalizada">Finalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Campaign ID</Label>
                    <Input
                      value={formData.meta_campaign_id}
                      onChange={(e) => setFormData({ ...formData, meta_campaign_id: e.target.value })}
                      placeholder="23851234567890"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Presupuesto Diario (USD)</Label>
                    <Input
                      type="number"
                      value={formData.daily_budget}
                      onChange={(e) => setFormData({ ...formData, daily_budget: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Presupuesto Total (USD)</Label>
                    <Input
                      type="number"
                      value={formData.lifetime_budget}
                      onChange={(e) => setFormData({ ...formData, lifetime_budget: e.target.value })}
                      placeholder="3000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha Inicio</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Fin</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button variant="meta" onClick={handleSubmit}>
                  {editingCampaign ? "Guardar Cambios" : "Crear Campaña"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campañas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="activa">Activas</SelectItem>
            <SelectItem value="pausada">Pausadas</SelectItem>
            <SelectItem value="finalizada">Finalizadas</SelectItem>
            <SelectItem value="borrador">Borradores</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filteredCampaigns.length} campañas</Badge>
      </div>

      {/* Campaign List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No hay campañas</h3>
            <p className="text-sm text-muted-foreground">
              Crea tu primera campaña o sincroniza desde Meta Ads
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Megaphone className="h-5 w-5 text-meta-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <Badge variant="outline" className={getStatusColor(campaign.status)}>
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {campaign.client?.company} {campaign.objective && `• ${campaign.objective}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {campaign.daily_budget && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Diario</p>
                      <p className="text-sm font-medium flex items-center">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(campaign.daily_budget)}
                      </p>
                    </div>
                  )}
                  {campaign.start_date && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Período</p>
                      <p className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(campaign.start_date).toLocaleDateString("es-AR")}
                        {campaign.end_date && ` - ${new Date(campaign.end_date).toLocaleDateString("es-AR")}`}
                      </p>
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(campaign)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(campaign.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
