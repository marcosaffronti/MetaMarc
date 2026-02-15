"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Client, Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  Globe,
  User,
  DollarSign,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";

export default function ClientesPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    website: "",
    meta_account_id: "",
    meta_pixel_id: "",
    assigned_to: "",
    notes: "",
    monthly_budget: "",
  });

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*, assigned_user:profiles!clients_assigned_to_fkey(id, full_name, email)")
      .order("created_at", { ascending: false });

    if (!error && data) setClients(data as any);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["admin", "usuario"]);
    if (data) setUsers(data);
  };

  useEffect(() => {
    fetchClients();
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      company: "",
      email: "",
      phone: "",
      website: "",
      meta_account_id: "",
      meta_pixel_id: "",
      assigned_to: "",
      notes: "",
      monthly_budget: "",
    });
    setEditingClient(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.company || !formData.email) {
      toast({ title: "Error", description: "Nombre, empresa y email son obligatorios", variant: "destructive" });
      return;
    }

    const payload = {
      name: formData.name,
      company: formData.company,
      email: formData.email,
      phone: formData.phone || null,
      website: formData.website || null,
      meta_account_id: formData.meta_account_id || null,
      meta_pixel_id: formData.meta_pixel_id || null,
      assigned_to: formData.assigned_to || null,
      notes: formData.notes || null,
      monthly_budget: formData.monthly_budget ? parseFloat(formData.monthly_budget) : null,
    };

    if (editingClient) {
      const { error } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", editingClient.id);

      if (error) {
        toast({ title: "Error", description: "No se pudo actualizar el cliente", variant: "destructive" });
        return;
      }
      toast({ title: "Cliente actualizado" });
    } else {
      const { error } = await supabase.from("clients").insert(payload);

      if (error) {
        toast({ title: "Error", description: "No se pudo crear el cliente", variant: "destructive" });
        return;
      }
      toast({ title: "Cliente creado exitosamente" });
    }

    setDialogOpen(false);
    resetForm();
    fetchClients();
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone || "",
      website: client.website || "",
      meta_account_id: client.meta_account_id || "",
      meta_pixel_id: client.meta_pixel_id || "",
      assigned_to: client.assigned_to || "",
      notes: client.notes || "",
      monthly_budget: client.monthly_budget?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el cliente", variant: "destructive" });
      return;
    }
    toast({ title: "Cliente eliminado" });
    fetchClients();
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tus clientes y sus cuentas de Meta Ads
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="meta">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
              </DialogTitle>
              <DialogDescription>
                {editingClient
                  ? "Modifica los datos del cliente"
                  : "Ingresa los datos del nuevo cliente"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Mi Empresa S.A."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="juan@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+54 11 1234-5678"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Sitio Web</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.empresa.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_account_id">Meta Account ID</Label>
                  <Input
                    id="meta_account_id"
                    value={formData.meta_account_id}
                    onChange={(e) => setFormData({ ...formData, meta_account_id: e.target.value })}
                    placeholder="act_123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_pixel_id">Meta Pixel ID</Label>
                  <Input
                    id="meta_pixel_id"
                    value={formData.meta_pixel_id}
                    onChange={(e) => setFormData({ ...formData, meta_pixel_id: e.target.value })}
                    placeholder="123456789"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Asignado a</Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_budget">Presupuesto Mensual (USD)</Label>
                  <Input
                    id="monthly_budget"
                    type="number"
                    value={formData.monthly_budget}
                    onChange={(e) => setFormData({ ...formData, monthly_budget: e.target.value })}
                    placeholder="5000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales sobre el cliente..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button variant="meta" onClick={handleSubmit}>
                {editingClient ? "Guardar Cambios" : "Crear Cliente"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">{filteredClients.length} clientes</Badge>
      </div>

      {/* Client Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No hay clientes</h3>
            <p className="text-sm text-muted-foreground">
              Crea tu primer cliente para comenzar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">{client.name}</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Building2 className="h-3 w-3" /> {client.company}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(client)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    {profile?.role === "admin" && (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{client.website}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  {client.assigned_user ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {(client.assigned_user as any).full_name}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin asignar</span>
                  )}
                  {client.monthly_budget && (
                    <div className="flex items-center gap-1 text-xs font-medium">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(client.monthly_budget)}/mes
                    </div>
                  )}
                </div>
                {client.meta_account_id && (
                  <Badge variant="outline" className="text-xs">
                    Meta: {client.meta_account_id}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
