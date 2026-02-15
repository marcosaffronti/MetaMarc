"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Save, User, Shield, Key } from "lucide-react";

export default function ConfiguracionPage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);

  // Admin-only state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newRole, setNewRole] = useState("");
  const [users, setUsers] = useState<any[]>([]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone: phone || null })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar el perfil", variant: "destructive" });
    } else {
      toast({ title: "Perfil actualizado" });
      await refreshProfile();
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    const { error } = await supabase.auth.updateUser({
      password: prompt("Ingresa tu nueva contraseña (mínimo 6 caracteres):") || undefined,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contraseña actualizada" });
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("full_name");
    if (data) setUsers(data);
  };

  const handleRoleChange = async () => {
    if (!selectedUserId || !newRole) return;

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", selectedUserId);

    if (error) {
      toast({ title: "Error", description: "No se pudo cambiar el rol", variant: "destructive" });
    } else {
      toast({ title: "Rol actualizado" });
      fetchUsers();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Administra tu perfil y configuración de la cuenta
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Perfil
          </CardTitle>
          <CardDescription>Actualiza tu información personal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile?.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Nombre Completo</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 11 1234-5678"
            />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Input value={profile?.role || ""} disabled />
          </div>
          <Button variant="meta" onClick={handleSaveProfile} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" /> Seguridad
          </CardTitle>
          <CardDescription>Cambia tu contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleChangePassword}>
            Cambiar Contraseña
          </Button>
        </CardContent>
      </Card>

      {/* Admin: Role Management */}
      {profile?.role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Gestión de Roles
            </CardTitle>
            <CardDescription>
              Cambia los roles de los usuarios (solo administradores)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={fetchUsers}>
              Cargar Usuarios
            </Button>
            {users.length > 0 && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Usuario</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar usuario" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.full_name || u.email} ({u.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nuevo Rol</Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="usuario">Usuario</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button variant="meta" onClick={handleRoleChange} disabled={!selectedUserId || !newRole}>
                  Cambiar Rol
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
