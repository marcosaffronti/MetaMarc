"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Task, Client, Campaign, Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  CheckSquare,
  MoreVertical,
  Pencil,
  Trash2,
  CalendarDays,
  User,
  Building2,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusIcons: Record<string, any> = {
  pendiente: Circle,
  en_progreso: Clock,
  completada: CheckCircle2,
  cancelada: XCircle,
};

export default function TareasPage() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "media",
    status: "pendiente",
    client_id: "",
    campaign_id: "",
    assigned_to: "",
    due_date: "",
  });

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        "*, client:clients(id, name, company), campaign:campaigns(id, name), assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email), creator:profiles!tasks_created_by_fkey(id, full_name)"
      )
      .order("created_at", { ascending: false });

    if (!error && data) setTasks(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    const fetchRelated = async () => {
      const [clientsRes, usersRes] = await Promise.all([
        supabase.from("clients").select("id, name, company").eq("is_active", true).order("company"),
        supabase.from("profiles").select("*").in("role", ["admin", "usuario"]),
      ]);
      if (clientsRes.data) setClients(clientsRes.data as any);
      if (usersRes.data) setUsers(usersRes.data);
    };
    fetchRelated();
  }, []);

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!formData.client_id) {
        setCampaigns([]);
        return;
      }
      const { data } = await supabase
        .from("campaigns")
        .select("id, name")
        .eq("client_id", formData.client_id)
        .order("name");
      if (data) setCampaigns(data as any);
    };
    fetchCampaigns();
  }, [formData.client_id]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "media",
      status: "pendiente",
      client_id: "",
      campaign_id: "",
      assigned_to: "",
      due_date: "",
    });
    setEditingTask(null);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast({ title: "Error", description: "El título es obligatorio", variant: "destructive" });
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description || null,
      priority: formData.priority,
      status: formData.status,
      client_id: formData.client_id || null,
      campaign_id: formData.campaign_id || null,
      assigned_to: formData.assigned_to || null,
      due_date: formData.due_date || null,
      ...(editingTask ? {} : { created_by: user!.id }),
      ...(formData.status === "completada" ? { completed_at: new Date().toISOString() } : { completed_at: null }),
    };

    if (editingTask) {
      const { error } = await supabase.from("tasks").update(payload).eq("id", editingTask.id);
      if (error) {
        toast({ title: "Error", description: "No se pudo actualizar la tarea", variant: "destructive" });
        return;
      }
      toast({ title: "Tarea actualizada" });
    } else {
      const { error } = await supabase.from("tasks").insert(payload);
      if (error) {
        toast({ title: "Error", description: "No se pudo crear la tarea", variant: "destructive" });
        return;
      }
      toast({ title: "Tarea creada exitosamente" });
    }

    setDialogOpen(false);
    resetForm();
    fetchTasks();
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      client_id: task.client_id || "",
      campaign_id: task.campaign_id || "",
      assigned_to: task.assigned_to || "",
      due_date: task.due_date || "",
    });
    setDialogOpen(true);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const payload: any = {
      status: newStatus,
      completed_at: newStatus === "completada" ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from("tasks").update(payload).eq("id", taskId);
    if (!error) {
      toast({ title: `Tarea marcada como ${getStatusLabel(newStatus).toLowerCase()}` });
      fetchTasks();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar la tarea", variant: "destructive" });
      return;
    }
    toast({ title: "Tarea eliminada" });
    fetchTasks();
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesTab =
      activeTab === "todas" ||
      (activeTab === "mis_tareas" && t.assigned_to === user?.id) ||
      t.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const taskCounts = {
    todas: tasks.length,
    pendiente: tasks.filter((t) => t.status === "pendiente").length,
    en_progreso: tasks.filter((t) => t.status === "en_progreso").length,
    completada: tasks.filter((t) => t.status === "completada").length,
    mis_tareas: tasks.filter((t) => t.assigned_to === user?.id).length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
          <p className="text-muted-foreground">
            Gestiona las tareas de tu equipo
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="meta">
              <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Editar Tarea" : "Nueva Tarea"}
              </DialogTitle>
              <DialogDescription>
                {editingTask ? "Modifica los datos de la tarea" : "Crea una nueva tarea"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Optimizar campaña de conversiones"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalles de la tarea..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="en_progreso">En Progreso</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(v) => setFormData({ ...formData, client_id: v, campaign_id: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Campaña</Label>
                  <Select
                    value={formData.campaign_id}
                    onValueChange={(v) => setFormData({ ...formData, campaign_id: v })}
                    disabled={!formData.client_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar campaña" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asignado a</Label>
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
                  <Label>Fecha límite</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button variant="meta" onClick={handleSubmit}>
                {editingTask ? "Guardar Cambios" : "Crear Tarea"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Tabs */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tareas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="todas">Todas ({taskCounts.todas})</TabsTrigger>
          <TabsTrigger value="pendiente">Pendientes ({taskCounts.pendiente})</TabsTrigger>
          <TabsTrigger value="en_progreso">En Progreso ({taskCounts.en_progreso})</TabsTrigger>
          <TabsTrigger value="completada">Completadas ({taskCounts.completada})</TabsTrigger>
          <TabsTrigger value="mis_tareas">Mis Tareas ({taskCounts.mis_tareas})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No hay tareas</h3>
            <p className="text-sm text-muted-foreground">
              Crea tu primera tarea para comenzar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const StatusIcon = statusIcons[task.status] || Circle;
            return (
              <Card key={task.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center gap-4 p-4">
                  <button
                    onClick={() =>
                      handleStatusChange(
                        task.id,
                        task.status === "completada" ? "pendiente" : "completada"
                      )
                    }
                    className="shrink-0"
                  >
                    <StatusIcon
                      className={`h-5 w-5 ${
                        task.status === "completada"
                          ? "text-green-500"
                          : task.status === "en_progreso"
                          ? "text-blue-500"
                          : task.status === "cancelada"
                          ? "text-red-500"
                          : "text-gray-400"
                      }`}
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-medium truncate ${
                          task.status === "completada" ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {task.client && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {task.client.company}
                        </span>
                      )}
                      {task.assigned_user && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {task.assigned_user.full_name}
                        </span>
                      )}
                      {task.due_date && (
                        <span
                          className={`text-xs flex items-center gap-1 ${
                            new Date(task.due_date) < new Date() && task.status !== "completada"
                              ? "text-red-500 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          <CalendarDays className="h-3 w-3" />
                          {format(new Date(task.due_date), "dd MMM yyyy", { locale: es })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(task)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusChange(task.id, "pendiente")}>
                        <Circle className="mr-2 h-4 w-4" /> Pendiente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(task.id, "en_progreso")}>
                        <Clock className="mr-2 h-4 w-4" /> En Progreso
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(task.id, "completada")}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Completada
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
