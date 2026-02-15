# MetaMarc CRM

CRM para agencias de Meta Ads construido con Next.js 14, Supabase y Tailwind CSS.

## Estructura del Proyecto

```
/app
  /api
    /meta-ads/sync          # POST - Sincronizar campañas desde Meta Ads API
    /meta-ads/accounts      # GET - Listar cuentas publicitarias de Meta
    /campaigns              # GET/POST - CRUD de campañas
    /clients                # GET/POST - CRUD de clientes
    /clients/[id]           # GET/PATCH/DELETE - Operaciones sobre un cliente
    /tasks                  # GET/POST - CRUD de tareas
    /tasks/[id]             # GET/PATCH/DELETE - Operaciones sobre una tarea
    /dashboard              # GET - Métricas del dashboard
    /dashboard/metrics-by-date  # GET - Métricas por fecha
  /(dashboard)              # Route group para páginas autenticadas
    /dashboard              # Panel principal con métricas
    /clientes               # Gestión de clientes
    /campanas               # Gestión de campañas
    /metricas               # Visualización de métricas
    /tareas                 # Sistema de tareas
    /configuracion          # Configuración y perfil
  /login                    # Página de inicio de sesión
  /registro                 # Página de registro
  /auth/callback            # Callback de autenticación Supabase
/components
  /ui                       # Componentes shadcn/ui (button, card, input, etc.)
  /dashboard                # Componentes del dashboard (metric-card, charts, etc.)
  sidebar.tsx               # Navegación lateral
  toaster.tsx               # Sistema de notificaciones
/lib
  /supabase                 # Clientes de Supabase (client, server, middleware)
  /meta-ads                 # Cliente de Meta Ads API
  auth-context.tsx          # Contexto de autenticación React
  utils.ts                  # Utilidades (cn, formatters, color helpers)
/hooks
  use-toast.ts              # Hook para notificaciones toast
/types
  database.ts               # Tipos TypeScript (Profile, Client, Campaign, Task, etc.)
/supabase
  schema.sql                # Schema completo de la base de datos
```

## Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Base de datos**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth con sistema de roles (admin, usuario, cliente)
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Gráficos**: Recharts
- **Íconos**: Lucide React
- **Lenguaje**: TypeScript
- **Deploy**: Vercel

## Comandos

```bash
npm install          # Instalar dependencias
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Build de producción
npm run lint         # Ejecutar linter
```

## Variables de Entorno

Copiar `.env.local.example` a `.env.local` y configurar:

- `NEXT_PUBLIC_SUPABASE_URL` - URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clave anónima de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clave de servicio (server-side)
- `META_APP_ID` - ID de la aplicación de Meta
- `META_APP_SECRET` - Secret de la aplicación de Meta
- `META_ACCESS_TOKEN` - Token de acceso de Meta Ads API

## Base de Datos

El schema se encuentra en `supabase/schema.sql`. Tablas principales:
- **profiles** - Extiende auth.users con roles y datos de perfil
- **clients** - Clientes de la agencia
- **campaigns** - Campañas de Meta Ads
- **campaign_metrics** - Métricas diarias por campaña
- **tasks** - Sistema de tareas con prioridades

RLS (Row Level Security) está habilitado en todas las tablas.

## Sistema de Roles

- **admin**: Acceso completo, gestión de roles, eliminación de clientes
- **usuario**: CRUD de clientes, campañas y tareas
- **cliente**: Vista limitada a sus propios datos

## Convenciones

- Todo el UI está en español
- Rutas de la API en inglés
- Tipos de datos definidos en `/types/database.ts`
- Componentes UI reutilizables en `/components/ui/`
- Los estados de campañas: activa, pausada, finalizada, borrador
- Los estados de tareas: pendiente, en_progreso, completada, cancelada
- Las prioridades de tareas: baja, media, alta, urgente
