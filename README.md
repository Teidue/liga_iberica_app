# Liga Ibérica Portal

> Sistema de gestión integral de torneos de fútbol sala. Monorepo full-stack con **Next.js 16** (frontend) + **NestJS 11** (backend) + **PostgreSQL 17**.

---

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Arquitectura](#2-arquitectura)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Instalación Rápida](#4-instalación-rápida)
5. [Variables de Entorno](#5-variables-de-entorno)
6. [Estructura del Proyecto](#6-estructura-del-proyecto)
7. [Roles y Control de Acceso](#7-roles-y-control-de-acceso)
8. [Backend — Módulos y API](#8-backend--módulos-y-api)
9. [Frontend — Biblioteca de Componentes](#9-frontend--biblioteca-de-componentes)
10. [Sistema de Diseño](#10-sistema-de-diseño)
11. [Seeder y Datos de Prueba](#11-seeder-y-datos-de-prueba)
12. [Scripts Disponibles](#12-scripts-disponibles)
13. [Plan de Pruebas Manual](#13-plan-de-pruebas-manual)
14. [Troubleshooting](#14-troubleshooting)
15. [Roadmap](#15-roadmap)

---

## 1. Visión General

Liga Ibérica Portal centraliza la gestión de torneos de fútbol sala en dos portales diferenciados:

| Portal | Ruta | Rol | Funcionalidad |
|--------|------|-----|---------------|
| **Super Admin** | `/admin` | `SUPER_ADMIN` | Torneos, jornadas, sedes, usuarios, pagos, invitados |
| **Team Admin** | `/team` | `TEAM_ADMIN` | Equipos propios, jugadores, asistencia, inscripciones, pagos |

### Flujos de negocio principales

```
SUPER_ADMIN crea torneo
    └── agrega jornadas con sede y fecha
         └── TEAM_ADMIN inscribe su equipo
              ├── registra jugadores asistentes por jornada
              │    └── puede incluir un invitado por jugador
              └── envía pago de inscripción
                   └── SUPER_ADMIN aprueba o rechaza el pago
```

---

## 2. Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                      Monorepo (Turborepo)                    │
│                                                              │
│  ┌─────────────────────┐      ┌──────────────────────────┐  │
│  │      apps/web        │      │        apps/api          │  │
│  │   Next.js 16.1.5    │◄────►│      NestJS 11           │  │
│  │   React 19          │ HTTP │   TypeORM 0.3.28          │  │
│  │   Puerto 3000       │      │   Puerto 3001            │  │
│  │                     │      │                          │  │
│  │  /login     ─────────────► public                     │  │
│  │  /admin/*   ─────────────► JwtAuthGuard + SUPER_ADMIN │  │
│  │  /team/*    ─────────────► JwtAuthGuard + TEAM_ADMIN  │  │
│  └─────────────────────┘      └────────────┬─────────────┘  │
│                                            │                │
│  ┌─────────────────────────────────────────▼─────────────┐  │
│  │                   PostgreSQL 17                        │  │
│  │        (synchronize: true en dev · SSL en prod)        │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Autenticación:** JWT de 7 días, almacenado en `localStorage` (Axios) y cookie `SameSite=Strict` (SSR route guard en `proxy.ts`).

---

## 3. Stack Tecnológico

### Backend (`apps/api`)

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| NestJS | **11** | Framework modular con DI, guards, pipes |
| TypeORM | 0.3.28 | ORM, entidades, relaciones |
| PostgreSQL | 17 | Base de datos relacional principal |
| `@nestjs/jwt` + Passport | 11 | Estrategia JWT stateless |
| `@nestjs/swagger` | 11 | Docs OpenAPI auto-generadas |
| class-validator / class-transformer | 0.14 / 0.5 | Validación de DTOs |
| bcryptjs | 3 | Hash de contraseñas |
| `pg` | 8.18 | Driver PostgreSQL |

### Frontend (`apps/web`)

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | **16.1.5** | App Router, SSR, route protection |
| React | 19 | UI library |
| TypeScript | **5.9.2** | Modo strict, 0 errores |
| Tailwind CSS | **4** | Estilos utilitarios (sintaxis v4) |
| shadcn/ui + Radix UI | — | Componentes accesibles (no modificar) |
| react-hook-form | 7.71 | Gestión de formularios |
| Zod | 4 | Validación de esquemas |
| Axios | 1.13 | Cliente HTTP con interceptores JWT |
| Sonner | 2 | Notificaciones toast |
| Three.js + React Three Fiber | 0.183 / 9 | Escena 3D del login |
| framer-motion | 12 | Animaciones |
| XLSX | 0.18 | Exportación de asistencia a Excel |
| Lucide React | 0.575 | Iconografía |

### Tooling

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| pnpm | 9 | Package manager del monorepo |
| Turborepo | — | Build cache distribuido entre apps |
| Node.js | ≥ 18 | Runtime |

---

## 4. Instalación Rápida

### Requisitos previos

- Node.js ≥ 18
- pnpm v9: `npm install -g pnpm`
- PostgreSQL 17 corriendo localmente

### Paso 1 — Base de datos

Ejecutar en `psql` o pgAdmin:

```sql
CREATE USER liga_user WITH PASSWORD 'liga123';
CREATE DATABASE liga_iberica;
GRANT ALL PRIVILEGES ON DATABASE liga_iberica TO liga_user;
ALTER DATABASE liga_iberica OWNER TO liga_user;
```

### Paso 2 — Clonar e instalar

```bash
git clone <repo-url>
cd liga_iberica_app
pnpm install
```

### Paso 3 — Variables de entorno

El archivo `apps/api/.env` ya existe con defaults de desarrollo (ver sección 5).

Crear `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Paso 4 — Iniciar en desarrollo

```bash
pnpm dev          # Inicia api (3001) y web (3000) concurrentemente
```

O por separado:

```bash
cd apps/api && pnpm dev    # NestJS con hot-reload (ts-node)
cd apps/web && pnpm dev    # Next.js en puerto 3000
```

### Paso 5 — Verificar

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| API REST | http://localhost:3001 |
| Swagger | http://localhost:3001/api/docs |

Al arrancar por primera vez con la BD vacía, el seeder crea automáticamente usuarios, equipos y datos de prueba (ver sección 11).

---

## 5. Variables de Entorno

### Backend — `apps/api/.env`

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=liga_user
DB_PASSWORD=liga123
DB_NAME=liga_iberica

# JWT
JWT_SECRET=liga_iberica_secret_key_change_in_production_2024
JWT_EXPIRES_IN=7d

# Servidor
NODE_ENV=development
PORT=3001

# CORS
FRONTEND_URL=http://localhost:3000
```

> En producción: cambiar `JWT_SECRET`, usar un secret de al menos 64 caracteres, y establecer `NODE_ENV=production`.

### Frontend — `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 6. Estructura del Proyecto

```
liga_iberica_app/
├── apps/
│   │
│   ├── web/                                  # Next.js 16 — Puerto 3000
│   │   ├── app/
│   │   │   ├── layout.tsx                    # Root: fuente Montserrat, AuthProvider, Toaster
│   │   │   ├── page.tsx                      # → redirect /login
│   │   │   ├── globals.css                   # Tailwind v4 + paleta de marca
│   │   │   ├── (auth)/login/page.tsx         # Escena 3D + formulario de login
│   │   │   │
│   │   │   ├── (admin)/                      # Grupo de rutas SUPER_ADMIN
│   │   │   │   ├── layout.tsx                # Shell: AdminSidebar + main container
│   │   │   │   └── admin/
│   │   │   │       ├── page.tsx              # Dashboard: 4 KPIs + pending payments + jornadas
│   │   │   │       ├── clubes/               # CRUD sedes + config formato Excel por sede
│   │   │   │       ├── equipos/              # Listado + detalle (read-only para admin global)
│   │   │   │       ├── invitados/            # Listado + detalle de personas invitadas
│   │   │   │       ├── jornadas/             # CRUD + toggle cerrar asistencia + export Excel
│   │   │   │       ├── pagos/                # Tabs pendiente/aprobado/rechazado + aprobar/rechazar
│   │   │   │       ├── perfil/               # Edición del perfil del super admin
│   │   │   │       ├── torneos/              # CRUD + inscripciones + jornadas del torneo
│   │   │   │       └── usuarios/             # CRUD usuarios + cambio de contraseña separado
│   │   │   │
│   │   │   └── (team)/                       # Grupo de rutas TEAM_ADMIN
│   │   │       ├── layout.tsx                # Shell: TeamSidebar + main container
│   │   │       └── team/
│   │   │           ├── page.tsx              # Dashboard: saludo + 4 KPIs + jornadas + equipos
│   │   │           ├── asistencia/           # Lista jornadas + registro asistencia con switches
│   │   │           ├── pagos/                # Lista pagos + nuevo pago (selección de inscripción)
│   │   │           ├── perfil/               # Edición del perfil del team admin
│   │   │           ├── teams/                # CRUD equipos + gestión de jugadores
│   │   │           └── torneos/              # Lista torneos disponibles + formulario inscripción
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                           # Primitivos shadcn/ui — NO modificar
│   │   │   ├── sidebar.tsx                   # BaseSidebar: desktop+mobile, accent colors
│   │   │   ├── admin-sidebar.tsx             # Configuración nav SUPER_ADMIN
│   │   │   ├── team-sidebar.tsx              # Configuración nav TEAM_ADMIN
│   │   │   ├── page-header.tsx               # Título de página + botón de acción
│   │   │   ├── list-skeleton.tsx             # Placeholder de carga para listas
│   │   │   ├── empty-state.tsx               # Estado vacío con icono y CTA
│   │   │   ├── entity-card.tsx               # Card clicable para listas de entidades
│   │   │   ├── stats-card.tsx                # Card KPI para dashboards
│   │   │   ├── confirm-dialog.tsx            # Confirmación de acción destructiva
│   │   │   ├── form-page.tsx                 # Wrapper max-w-lg + botón volver
│   │   │   └── login-scene.tsx               # Three.js: trofeo 3D + balón + partículas
│   │   │
│   │   ├── contexts/auth-context.tsx         # Estado JWT global (hook useAuth)
│   │   ├── lib/
│   │   │   ├── api.ts                        # Axios + interceptor JWT + redirect en 401
│   │   │   ├── types.ts                      # Tipos de dominio TypeScript
│   │   │   └── utils.ts                      # cn(), isAxiosError(), extractApiError()
│   │   ├── proxy.ts                          # Protección de rutas (Next.js 16, reemplaza middleware.ts)
│   │   └── components.json                   # Configuración shadcn/ui
│   │
│   └── api/                                  # NestJS 11 — Puerto 3001
│       └── src/
│           ├── main.ts                       # Bootstrap: ValidationPipe, CORS, Swagger
│           ├── app.module.ts                 # Módulo raíz + TypeORM config (dev/prod)
│           ├── data-source.ts                # DataSource para CLI de migraciones
│           ├── auth/                         # Login, JWT strategy, guards, decoradores de rol
│           ├── users/                        # Entidad User, CRUD, roles
│           ├── teams/                        # Entidad Team, CRUD, endpoint /my
│           ├── players/                      # Entidad Player, CRUD, búsqueda, filtro por equipo
│           ├── clubs/                        # Entidad Club/Sede, CRUD, configuración Excel
│           ├── tournaments/                  # Entidad Tournament, CRUD, filtros activo/próximo/pasado
│           ├── match-days/                   # Entidad MatchDay, CRUD, toggle cerrado
│           ├── tournament-teams/             # Inscripciones, balance de pago
│           ├── player-match-days/            # Asistencia por jornada, bulk, estadísticas
│           ├── payments/                     # Pagos, aprobación/rechazo
│           ├── guest-people/                 # Invitados, búsqueda por documento
│           ├── seed/                         # Seeder automático (OnApplicationBootstrap)
│           ├── database/                     # DatabaseModule
│           └── common/
│               ├── entities/base.entity.ts   # UUID pk, created_at, updated_at
│               └── enums/index.ts            # UserRole, PaymentMethod, PaymentStatus
│
├── packages/
│   ├── ui/                                   # Stubs de componentes compartidos
│   ├── eslint-config/                        # Configuración ESLint compartida
│   └── typescript-config/                    # tsconfig bases compartidos
│
├── turbo.json
├── pnpm-workspace.yaml
├── AGENTS.md                                 # Guía completa para agentes IA
├── CLAUDE.md                                 # Apunta a AGENTS.md
├── liga_iberica_test_plan.md                 # Plan de pruebas manuales (50 pasos)
└── README.md
```

---

## 7. Roles y Control de Acceso

| Rol | Rutas frontend | Alcance en backend |
|-----|---------------|-------------------|
| `SUPER_ADMIN` | `/admin/*` | Acceso global a todos los recursos |
| `TEAM_ADMIN` | `/team/*` | Solo sus propios equipos y jugadores |

### Capas de protección

1. **`proxy.ts`** (Next.js 16) — Lee cookie `auth_role` en el servidor. Redirige antes de cargar la página.
2. **`JwtAuthGuard` + `RolesGuard`** (NestJS) — Validan el token JWT y el rol en cada endpoint.
3. **`useAuth()` hook** — Estado del usuario en el cliente para renderizado condicional de UI.

### Ciclo de vida del token

```
Login → access_token (JWT, 7d)
  ├── localStorage['auth_token']    → Axios interceptor
  ├── localStorage['auth_user']     → useAuth() hydration
  ├── Cookie auth_token (7d)        → proxy.ts SSR guard
  └── Cookie auth_role (7d)         → proxy.ts role check

401 response → limpiar localStorage + cookies → redirect /login
```

---

## 8. Backend — Módulos y API

### Modelo de datos

```
User (SUPER_ADMIN | TEAM_ADMIN)
  └── teams[]  ←────── Team.adminId FK

Team
  ├── players[]
  └── tournamentTeams[]

Tournament
  ├── matchDays[]
  └── tournamentTeams[]

TournamentTeam  (inscripción equipo-torneo)
  ├── tournament, team
  └── payments[]

MatchDay  (jornada)
  ├── tournament, club
  └── playerMatchDays[]

PlayerMatchDay  (registro asistencia)
  ├── player, matchDay
  └── guest? → GuestPerson

Payment
  └── tournamentTeam

Club  (sede/pabellón)
  └── formatoExcel: JSON  (columnas para export)

GuestPerson  (persona invitada)
  └── playerMatchDays[]
```

Todas las entidades extienden `BaseEntity`: `id UUID PK`, `created_at`, `updated_at`.

### Endpoints por módulo

| Módulo | Base | Endpoints principales |
|--------|------|-----------------------|
| **Auth** | `/auth` | `POST /login` · `POST /register` · `GET /profile` |
| **Users** | `/users` | CRUD completo · lista y eliminación requieren SUPER_ADMIN |
| **Teams** | `/teams` | CRUD · `GET /my` (equipos propios para TEAM_ADMIN) |
| **Players** | `/players` | CRUD · `GET /team/:teamId` · `GET /search?q=` |
| **Clubs** | `/clubs` | CRUD · `GET /with-excel-format` · `GET /default-excel-format` |
| **Tournaments** | `/tournaments` | CRUD · `GET /active` · `GET /upcoming` · `GET /past` |
| **Match Days** | `/match-days` | CRUD · `GET /upcoming` · `PATCH /:id` (toggle cerrado) |
| **Tournament Teams** | `/tournament-teams` | CRUD · `GET /balance/:id` (deuda restante) |
| **Player Match Days** | `/player-match-days` | CRUD · `POST /bulk` · `GET /team/:matchDayId` · `GET /stats/:matchDayId` |
| **Payments** | `/payments` | CRUD · `GET /pending|approved|rejected` · `POST /:id/approve` · `POST /:id/reject` |
| **Guest People** | `/guest-people` | CRUD · `GET /by-documento/:doc` |

**Documentación interactiva completa:** http://localhost:3001/api/docs

### Configuración TypeORM

- **Desarrollo:** `synchronize: true` — el esquema se sincroniza automáticamente al arrancar.
- **Producción:** `synchronize: false` — usar migraciones explícitas (ver scripts de DB en sección 12).
- **SSL:** desactivado en dev, habilitado con `rejectUnauthorized: false` en prod.
- **Pool de conexiones:** 2–10 conexiones en dev, 5–20 en prod.

### Configuración global de la API

```typescript
// main.ts — aplicado globalmente:
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Elimina campos no declarados en el DTO
  transform: true,           // Auto-transforma tipos (string → number, etc.)
  forbidNonWhitelisted: true // Lanza error si llegan campos extra
}))

app.enableCors({ origin: FRONTEND_URL, credentials: true })
```

Un middleware de compatibilidad normaliza tokens que llegan sin prefijo `Bearer ` (útil para Swagger).

---

## 9. Frontend — Biblioteca de Componentes

**Regla:** toda página nueva debe usar estos componentes. No reimplementar patrones ya existentes.

### `PageHeader` — Cabecera de página

```tsx
import { PageHeader } from '@/components/page-header'

<PageHeader
  title="Torneos"
  description="Gestiona los torneos de la liga"
  action={
    <Button asChild>
      <Link href="/admin/torneos/new">
        <Plus className="mr-2 h-4 w-4" />Nuevo torneo
      </Link>
    </Button>
  }
/>
```

### `ListSkeleton` — Carga de listas

```tsx
import { ListSkeleton } from '@/components/list-skeleton'

if (loading) return <ListSkeleton count={3} />
```

### `EmptyState` — Lista vacía

```tsx
import { EmptyState } from '@/components/empty-state'

<EmptyState
  icon={Trophy}
  title="No hay torneos aún"
  description="Crea el primero para empezar"
  action={<Button asChild><Link href="/admin/torneos/new">Nuevo torneo</Link></Button>}
/>
```

### `EntityCard` — Ítem de lista clicable

`ChevronRight` se añade automáticamente al final.

```tsx
import { EntityCard } from '@/components/entity-card'

<EntityCard
  href={`/admin/torneos/${t.id}`}
  iconBg="bg-brand/10"
  icon={Trophy}
  iconColor="text-brand"
  title={t.nombre}
  subtitle="01/01/2025 — 31/12/2025"
  right={<Badge variant="outline">Activo</Badge>}
/>
```

### `StatsCard` — Métrica de dashboard

```tsx
import { StatsCard } from '@/components/stats-card'

<StatsCard
  label="Torneos activos"
  value={stats.count}
  icon={Trophy}
  iconBg="bg-brand/10"
  iconColor="text-brand"
  loading={loading}   // muestra Skeleton si true
/>
```

### `ConfirmDialog` — Confirmación de acción destructiva

El botón de confirmación es siempre `variant="destructive"`.

```tsx
import { ConfirmDialog } from '@/components/confirm-dialog'

<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="Eliminar torneo"
  description={<>¿Eliminar <strong>{nombre}</strong>? Esta acción no se puede deshacer.</>}
  onConfirm={handleDelete}
  loading={deleting}
  confirmLabel="Eliminar"  // default
/>
```

> **Excepción:** `admin/pagos/[id]` usa un Dialog personalizado porque tiene acciones aprobar **y** rechazar con semánticas visuales distintas.

### `FormPage` — Wrapper para formularios estándar

Incluye botón de retroceso con `aria-label`, título y descripción. Limita el ancho a `max-w-lg`.

```tsx
import { FormPage } from '@/components/form-page'

<FormPage title="Nuevo torneo" description="Completa los datos" backHref="/admin/torneos">
  <Card>
    <CardContent>
      {/* form */}
    </CardContent>
  </Card>
</FormPage>
```

> **Excepción:** `team/teams/new` usa `max-w-2xl` (FieldArray de jugadores) y construye la cabecera manualmente.

### `extractApiError` — Extracción de errores de API

```typescript
import { extractApiError } from '@/lib/utils'

try {
  await api.post('/resource', data)
  toast.success('Creado correctamente')
} catch (err) {
  toast.error(extractApiError(err, 'Error al crear'))
}
```

### `BaseSidebar` — Sistema de sidebar

Tres modos de renderizado: desktop fijo (`lg+`, `w-60`), topbar móvil, drawer móvil (`w-72`).

```tsx
// Para añadir un nuevo portal, crear un wrapper thin:
export function NuevoSidebar() {
  return (
    <BaseSidebar
      navItems={NAV_ITEMS}
      accent="indigo"          // 'indigo' (admin) | 'emerald' (team)
      brandIcon={Shield}
      brandRole="Nuevo Rol"
      profileHref="/nuevo/perfil"
      dashboardHref="/nuevo"   // match exacto, no startsWith
      defaultInitials="NR"
    />
  )
}
```

### Patrón completo de página de lista

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Trophy } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { ListSkeleton } from '@/components/list-skeleton'
import { EmptyState } from '@/components/empty-state'
import { EntityCard } from '@/components/entity-card'
import api from '@/lib/api'
import { toast } from 'sonner'
import type { Tournament } from '@/lib/types'

export default function TorneosPage() {
  const [items, setItems] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Tournament[]>('/tournaments')
      .then(r => setItems(r.data))
      .catch(() => toast.error('Error al cargar torneos'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <ListSkeleton count={3} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Torneos"
        description="Gestiona los torneos de la liga"
        action={
          <Button asChild>
            <Link href="/admin/torneos/new">
              <Plus className="mr-2 h-4 w-4" />Nuevo torneo
            </Link>
          </Button>
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={Trophy} title="No hay torneos aún" description="Crea el primero" />
      ) : (
        <div className="space-y-4">
          {items.map(t => (
            <EntityCard
              key={t.id}
              href={`/admin/torneos/${t.id}`}
              iconBg="bg-brand/10"
              icon={Trophy}
              iconColor="text-brand"
              title={t.nombre}
              right={<Badge variant="outline">Activo</Badge>}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 10. Sistema de Diseño

### Paleta de marca

Definida en `apps/web/app/globals.css`. Editar estos 5 valores rethemea toda la app:

```css
@theme {
  --color-brand-darkest: #173753;   /* Fondo sidebar */
  --color-brand-dark:    #1b4353;   /* Tono oscuro primario */
  --color-brand:         #1D70A2;   /* Acción principal, botones */
  --color-brand-light:   #2892D7;   /* Hover, estados activos */
  --color-brand-muted:   #6DAEDB;   /* Acentos suaves */
}
```

Tailwind v4 genera automáticamente todas las variantes: `bg-brand`, `text-brand-light`, `bg-brand/10`, etc.

El token `--primary` de shadcn/ui está mapeado a `brand-dark`, por lo que todos los componentes de shadcn heredan la paleta.

### Colores semánticos

| Color | Clases Tailwind | Significado |
|-------|-----------------|-------------|
| Verde | `emerald-*` | Aprobado, confirmado, completo |
| Ámbar | `amber-*` | Pendiente, advertencia |
| Rojo | `red-*` | Rechazado, eliminación, peligro |
| Pizarra | `slate-900/700/500/400/300` | Jerarquía tipográfica |

### Jerarquía tipográfica

| Nivel | Clases | Uso |
|-------|--------|-----|
| H1 | `text-2xl font-bold text-slate-900` | Títulos de página |
| H2 | `text-base font-semibold` | Títulos de card |
| Cuerpo | `text-sm` | Texto por defecto |
| Muted | `text-sm text-slate-500` | Subtítulos, ayudas |
| Meta | `text-xs text-slate-500` | Fechas, etiquetas, conteos |

### Espaciado

| Propósito | Clases |
|-----------|--------|
| Entre secciones de página | `space-y-8` |
| Entre componentes | `space-y-6` |
| Entre campos de formulario | `space-y-5` |
| Entre ítems de lista | `space-y-4` / `gap-4` |

### Breakpoints responsive

| Prefijo | Ancho | Uso principal |
|---------|-------|---------------|
| (default) | < 640px | Layout de columna única |
| `sm:` | ≥ 640px | Grids 2 columnas |
| `lg:` | ≥ 1024px | Sidebar visible, grids 4 columnas |
| `xl:` | ≥ 1280px | Grids KPI 4 columnas |

---

## 11. Seeder y Datos de Prueba

El `SeedService` implementa `OnApplicationBootstrap`. Condiciones para ejecutarse:
- `NODE_ENV !== 'production'`
- La tabla `users` está vacía

### Datos creados

| Recurso | Detalle |
|---------|---------|
| Usuarios | 1 SUPER_ADMIN + 2 TEAM_ADMIN |
| Equipos | Los Tigres (Carlos), Los Leones (Ana) |
| Jugadores | 8–9 por equipo (17 total) |
| Sedes | Pabellón Municipal Centro, Polideportivo Norte |
| Torneos | Torneo Apertura 2025, Torneo Clausura 2025 |
| Jornadas | 3 jornadas para Torneo Apertura |
| Inscripciones | Ambos equipos en Torneo Apertura |
| Pagos | 1 aprobado, 2 pendientes |

### Credenciales de acceso

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Super Admin | admin@liga.com | admin123 | SUPER_ADMIN |
| Carlos | carlos@liga.com | admin123 | TEAM_ADMIN |
| Ana | ana@liga.com | admin123 | TEAM_ADMIN |

---

## 12. Scripts Disponibles

### Nivel raíz (monorepo)

```bash
pnpm install                                         # Instalar todas las dependencias
pnpm dev                                             # Ambas apps en desarrollo
pnpm build                                           # Build de producción
pnpm lint                                            # ESLint con --max-warnings 0
```

### TypeScript (desde raíz)

```bash
npx tsc --noEmit -p apps/web/tsconfig.json           # Check frontend
npx tsc --noEmit -p apps/api/tsconfig.json           # Check backend
```

### Base de datos (`apps/api`)

```bash
pnpm migration:generate   # Generar migración desde cambios en entidades
pnpm migration:run        # Aplicar migraciones pendientes
pnpm migration:revert     # Revertir última migración
pnpm schema:drop          # Eliminar todas las tablas (¡destructivo!)
```

> En desarrollo `synchronize: true` hace las migraciones opcionales. Usar migraciones para producción.

### Frontend (`apps/web`)

```bash
pnpm dev              # Puerto 3000
pnpm build            # Build de producción (verifica errores TS + lint)
pnpm start            # Iniciar build de producción
pnpm typecheck        # next typegen + tsc --noEmit
```

---

## 13. Plan de Pruebas Manual

El archivo `liga_iberica_test_plan.md` contiene 50 pasos organizados en 8 bloques:

| Bloque | Cobertura |
|--------|-----------|
| 1 | Autenticación y protección de rutas |
| 2 | SUPER_ADMIN: gestión de sedes |
| 3 | SUPER_ADMIN: torneos y jornadas |
| 4 | SUPER_ADMIN: usuarios |
| 5 | TEAM_ADMIN: equipos y jugadores |
| 6 | TEAM_ADMIN: inscripción en torneos y pagos |
| 7 | TEAM_ADMIN: asistencia a jornadas |
| 8 | Gestión de invitados |

**Flujos críticos:**
1. Torneo completo: crear torneo → jornada → inscripción → pago → aprobación
2. Asistencia: marcar jugadores → guardar → verificar persistencia
3. Protección de rutas: ningún rol puede acceder a secciones del otro

---

## 14. Troubleshooting

| Síntoma | Solución |
|---------|----------|
| `password authentication failed` | Verificar credenciales PostgreSQL en `apps/api/.env` |
| `Cannot find module dist/src/main` | Ejecutar `pnpm build` dentro de `apps/api` |
| `Port 3001 already in use` | Windows: `taskkill /F /IM node.exe` · Unix: `kill $(lsof -ti:3001)` |
| `Unauthorized` en Swagger | Pegar el token **sin** prefijo `Bearer ` (Swagger lo añade automáticamente) |
| Tablas no creadas al iniciar | Verificar que `synchronize: true` y que la BD existe con las credenciales correctas |
| `useSearchParams() should be wrapped in suspense` | Separar el componente con `useSearchParams()` en un hijo y envolverlo en `<Suspense>` |
| `Both middleware file and proxy file detected` | Eliminar `middleware.ts` — Next.js 16 usa exclusivamente `proxy.ts` |
| Error de tipos con `z.coerce.number()` | Usar `z.number()` + `e.target.valueAsNumber` en el `onChange` del input |
| `@typescript-eslint/no-unsafe-enum-comparison` | Comparar contra el valor del enum (`PaymentStatus.PENDING`), nunca contra el string literal |
| Seeder no ejecuta en segunda ejecución | Comportamiento esperado: es idempotente, no re-siembra si ya hay datos |

---

## 15. Roadmap

| Funcionalidad | Estado |
|---------------|--------|
| API NestJS — todos los módulos | ✅ Completo |
| Frontend Next.js — todos los portales | ✅ Completo |
| Autenticación JWT + guards por rol | ✅ Completo |
| Biblioteca de componentes + refactor DRY | ✅ Completo |
| Sistema de diseño + paleta de marca | ✅ Completo |
| 0 errores TypeScript · 0 warnings ESLint | ✅ Completo |
| Revisión UI/UX + accesibilidad | ✅ Completo |
| Integración Supabase / BD en cloud | ⏳ Pendiente |
| Despliegue en producción | ⏳ Pendiente |
| Tests unitarios y e2e | ⏳ Pendiente |
| Notificaciones por email | ⏳ Pendiente |
| Upload de comprobantes de pago | ⏳ Pendiente |
