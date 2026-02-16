# MetaMarc CRM

CRM para agencias de Meta Ads construido con Next.js 14, Supabase y Tailwind CSS.

## Comandos

```bash
npm install          # Instalar dependencias
npm run dev          # Iniciar servidor de desarrollo (localhost:3000)
npm run build        # Build de producción
npm run start        # Iniciar servidor de producción
npm run lint         # Ejecutar ESLint (next lint)
npm run db:migrate   # Aplicar migraciones (supabase db push)
npm run db:reset     # Resetear la base de datos (supabase db reset)
npm run db:seed      # Seed de datos (tsx scripts/seed.ts) — script no incluido en el repo
```

## Variables de Entorno

Copiar `.env.local.example` a `.env.local` y configurar:

- `NEXT_PUBLIC_SUPABASE_URL` - URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clave anónima de Supabase (client-side)
- `SUPABASE_SERVICE_ROLE_KEY` - Clave de servicio de Supabase (server-side only)
- `META_APP_ID` - ID de la aplicación de Meta
- `META_APP_SECRET` - Secret de la aplicación de Meta
- `META_ACCESS_TOKEN` - Token de acceso de Meta Ads API
- `NEXT_PUBLIC_APP_URL` - URL de la aplicación (default: `http://localhost:3000`)

## Stack Tecnológico

- **Framework**: Next.js 14.1.0 (App Router)
- **Base de datos**: Supabase (PostgreSQL) con RLS
- **Auth**: Supabase Auth (`@supabase/auth-helpers-nextjs`) con roles
- **UI**: Tailwind CSS 3.4 + shadcn/ui + Radix UI
- **Gráficos**: Recharts 2.12
- **Íconos**: Lucide React
- **Fechas**: date-fns 3.3
- **Lenguaje**: TypeScript 5.3 (strict mode)
- **Deploy**: Vercel

## Estructura del Proyecto

```
/app
  layout.tsx                    # Root layout (AuthProvider + Toaster)
  page.tsx                      # Landing page pública
  /auth/callback                # GET - Callback OAuth de Supabase
  /login                        # Página de login (email/password)
  /registro                     # Página de registro
  /api
    /campaigns                  # GET/POST - Campañas
    /clients                    # GET/POST - Clientes
    /clients/[id]               # GET/PATCH/DELETE - Cliente individual
    /tasks                      # GET/POST - Tareas
    /tasks/[id]                 # GET/PATCH/DELETE - Tarea individual
    /dashboard                  # GET - Métricas agregadas (últimos 30 días)
    /dashboard/metrics-by-date  # GET - Métricas diarias (?days=30)
    /meta-ads/accounts          # GET - Cuentas publicitarias de Meta
    /meta-ads/sync              # POST - Sincronizar campañas desde Meta Ads
  /(dashboard)                  # Route group para páginas autenticadas
    layout.tsx                  # Layout con Sidebar
    /dashboard                  # Panel principal con KPIs y gráficos
    /clientes                   # Gestión de clientes (CRUD)
    /campanas                   # Gestión de campañas + sync Meta Ads
    /metricas                   # Visualización avanzada de métricas
    /tareas                     # Sistema de tareas con tabs por estado
    /configuracion              # Configuración, perfil y gestión de roles
/components
  /ui                           # 14 componentes shadcn/ui (button, card, dialog, etc.)
  /dashboard                    # metric-card, metrics-chart, recent-tasks, top-campaigns
  sidebar.tsx                   # Navegación lateral colapsable
  toaster.tsx                   # Contenedor de notificaciones toast
/lib
  /supabase
    client.ts                   # Cliente Supabase para client-side
    server.ts                   # Cliente Supabase para server-side + service role
    middleware.ts               # Middleware de auth (protección de rutas)
  /meta-ads
    client.ts                   # MetaAdsClient: getAdAccounts, getCampaigns, syncCampaignData
  auth-context.tsx              # React Context de autenticación (user, profile, role)
  utils.ts                      # cn(), formatCurrency(), getStatusColor(), etc.
/hooks
  use-toast.ts                  # Hook para notificaciones toast
/types
  database.ts                   # Tipos TS: Profile, Client, Campaign, CampaignMetric, Task, etc.
/supabase
  schema.sql                    # Schema completo DDL con RLS y triggers
middleware.ts                   # Next.js middleware entry point
```

## Arquitectura y Patrones

### Autenticación y Middleware

- `middleware.ts` (root) delega a `lib/supabase/middleware.ts`
- Rutas públicas: `/`, `/login`, `/registro`, `/auth/*`
- Todas las demás rutas redirigen a `/login` si no hay sesión
- Usuarios autenticados que acceden a rutas de auth son redirigidos a `/dashboard`
- `lib/auth-context.tsx` provee `AuthProvider` con user, profile, loading, signOut, refreshProfile

### API Routes

Todas las API routes usan `createRouteHandlerClient` de Supabase. Patrones comunes:
- Obtienen sesión con `supabase.auth.getSession()`
- Retornan `401` si no hay sesión
- Usan `NextResponse.json()` para respuestas
- Errores retornan status apropiado con `{ error: message }`

### Path Alias

- `@/*` mapea a la raíz del proyecto (configurado en `tsconfig.json`)

### Theming / Estilos

- Dark mode via clase CSS (`darkMode: ["class"]`)
- Colores del tema definidos con CSS variables HSL (ver `tailwind.config.ts`)
- Colores de marca Meta: `meta.blue` (#1877F2), `meta.blue-dark`, `meta.blue-light`
- Container max-width: 1400px, centrado con padding 2rem

## Base de Datos

Schema en `supabase/schema.sql`. Tablas principales:

| Tabla | Descripción | Campos clave |
|-------|-------------|--------------|
| `profiles` | Extiende auth.users | role (admin/usuario/cliente), full_name, email |
| `clients` | Clientes de la agencia | name, company, email, meta_account_id, assigned_to, is_active |
| `campaigns` | Campañas de Meta Ads | client_id (FK), status, daily_budget, meta_campaign_id |
| `campaign_metrics` | Métricas diarias | campaign_id (FK), date, spend, impressions, clicks, conversions |
| `tasks` | Sistema de tareas | title, priority, status, assigned_to, created_by, due_date |

- **RLS** habilitado en todas las tablas
- **Trigger** `handle_new_user()`: crea perfil automáticamente al registrarse
- **Triggers** `update_*_updated_at()`: actualiza timestamps automáticamente
- **Constraint único**: `(campaign_id, date)` en campaign_metrics

## Sistema de Roles

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso completo, gestionar roles, eliminar clientes |
| `usuario` | CRUD de clientes, campañas y tareas |
| `cliente` | Solo lectura de sus propios datos |

## Convenciones

- Todo el UI está en **español**
- Rutas de la API en **inglés**
- Tipos de datos definidos en `/types/database.ts`
- Componentes UI reutilizables en `/components/ui/` (shadcn/ui)
- Formato de moneda: USD con locale `es-AR`
- Estados de campañas: `activa`, `pausada`, `finalizada`, `borrador`
- Estados de tareas: `pendiente`, `en_progreso`, `completada`, `cancelada`
- Prioridades de tareas: `baja`, `media`, `alta`, `urgente`
- Nombres de archivo en kebab-case
- Componentes React en PascalCase
- No hay tests ni CI/CD configurados actualmente
