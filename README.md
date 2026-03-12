# Liga Ibérica Portal

Sistema de gestión de torneos de fútbol sala (futsal). Permite a administradores globales gestionar torneos, jornadas, sedes y pagos; y a los administradores de equipo gestionar sus plantillas, asistencia e inscripciones.

---

## 1. Estado del Proyecto

| Área                          | Estado    |
| ----------------------------- | --------- |
| Backend API (NestJS)          | Completo  |
| Frontend (Next.js)            | Completo  |
| Autenticación JWT             | Completo  |
| Seeder de datos de prueba     | Completo  |
| Documentación Swagger         | Completo  |
| Refactor DRY del frontend     | Completo  |
| Sistema de color brand        | Completo  |
| Lint (0 warnings)             | Completo  |
| TypeScript strict (0 errores) | Completo  |
| Build de producción           | Completo  |
| Integración Supabase          | Pendiente |
| Despliegue producción         | Pendiente |
| Tests unitarios               | Pendiente |

---

## 2. Stack Tecnológico

### Backend (`apps/api`)

| Tecnología      | Versión | Propósito                       |
| --------------- | ------- | ------------------------------- |
| NestJS          | 10      | Framework backend               |
| TypeORM         | 0.3     | ORM para base de datos          |
| PostgreSQL      | 17      | Base de datos relacional        |
| JWT + Passport  | —       | Autenticación stateless         |
| Swagger/OpenAPI | —       | Documentación automática de API |
| class-validator | —       | Validación de DTOs              |
| bcryptjs        | —       | Hash de contraseñas             |

### Frontend (`apps/web`)

| Tecnología      | Versión | Propósito                    |
| --------------- | ------- | ---------------------------- |
| Next.js         | 16      | Framework React (App Router) |
| React           | 19      | Librería de UI               |
| TypeScript      | 5       | Tipado estático              |
| Tailwind CSS    | 3       | Estilos utilitarios          |
| shadcn/ui       | —       | Componentes UI accesibles    |
| react-hook-form | 7       | Gestión de formularios       |
| Zod             | 3       | Validación de esquemas       |
| Axios           | —       | Cliente HTTP                 |
| Sonner          | —       | Notificaciones toast         |
| Lucide React    | —       | Iconos                       |

### Infraestructura

| Tecnología  | Propósito                     |
| ----------- | ----------------------------- |
| pnpm v9     | Package manager               |
| Turborepo   | Monorepo con cache compartido |
| Node.js ≥18 | Runtime                       |

---

## 3. Estructura del Proyecto

```
liga_iberica_portal/
├── apps/
│   ├── web/                          # Frontend Next.js (puerto 3000)
│   │   ├── app/
│   │   │   ├── (admin)/admin/        # Rutas SUPER_ADMIN
│   │   │   │   ├── page.tsx          # Dashboard con KPIs
│   │   │   │   ├── clubes/
│   │   │   │   ├── equipos/
│   │   │   │   ├── invitados/
│   │   │   │   ├── jornadas/
│   │   │   │   ├── pagos/
│   │   │   │   ├── perfil/
│   │   │   │   ├── torneos/
│   │   │   │   └── usuarios/
│   │   │   ├── (auth)/login/         # Página de login pública
│   │   │   ├── (team)/team/          # Rutas TEAM_ADMIN
│   │   │   │   ├── page.tsx          # Dashboard del equipo
│   │   │   │   ├── asistencia/
│   │   │   │   ├── pagos/
│   │   │   │   ├── perfil/
│   │   │   │   ├── teams/
│   │   │   │   └── torneos/
│   │   │   ├── layout.tsx            # Root layout (Toaster, AuthProvider)
│   │   │   └── page.tsx              # Redirect a /login
│   │   ├── components/
│   │   │   ├── ui/                   # Componentes shadcn/ui (no modificar)
│   │   │   ├── sidebar.tsx           # BaseSidebar compartido (indigo/emerald)
│   │   │   ├── admin-sidebar.tsx     # Config del sidebar SUPER_ADMIN
│   │   │   ├── team-sidebar.tsx      # Config del sidebar TEAM_ADMIN
│   │   │   ├── page-header.tsx       # Cabecera de página (título + acción)
│   │   │   ├── list-skeleton.tsx     # Skeleton de carga para listas
│   │   │   ├── empty-state.tsx       # Estado vacío con icono y acción
│   │   │   ├── entity-card.tsx       # Card clicable para listas de entidades
│   │   │   ├── stats-card.tsx        # Card de KPI/métrica para dashboards
│   │   │   ├── confirm-dialog.tsx    # Diálogo de confirmación (ej. eliminar)
│   │   │   └── form-page.tsx         # Wrapper de página de formulario (max-w-lg)
│   │   ├── contexts/
│   │   │   └── auth-context.tsx      # Contexto JWT global (useAuth hook)
│   │   ├── lib/
│   │   │   ├── api.ts                # Instancia Axios con interceptor JWT
│   │   │   ├── types.ts              # Tipos del dominio compartidos
│   │   │   └── utils.ts              # cn(), isAxiosError(), extractApiError()
│   │   ├── proxy.ts                  # Protección de rutas (Next.js 16)
│   │   ├── components.json           # Config shadcn/ui
│   │   └── next.config.js
│   │
│   └── api/                          # Backend NestJS (puerto 3001)
│       └── src/
│           ├── auth/
│           ├── users/
│           ├── teams/
│           ├── players/
│           ├── clubs/
│           ├── tournaments/
│           ├── match-days/
│           ├── player-match-days/
│           ├── tournament-teams/
│           ├── payments/
│           ├── guest-people/
│           ├── seed/                 # Seeder automático (solo dev)
│           └── common/
│               ├── entities/         # BaseEntity
│               └── enums/            # UserRole, PaymentMethod, PaymentStatus
│
├── packages/
│   ├── ui/                    # Componentes compartidos del monorepo
│   ├── eslint-config/
│   └── typescript-config/
│
├── turbo.json
├── pnpm-workspace.yaml
├── AGENTS.md                  # Guía para agentes IA
├── CLAUDE.md                  # Referencia al AGENTS.md
└── README.md
```

---

## 4. Sistema de Color

### Paleta de marca

La app usa una paleta de azules corporativos definida en un único lugar. Para cambiar cualquier color de la app solo hay que editar ese archivo.

**Archivo:** `apps/web/app/globals.css` — bloque `@theme` al inicio del archivo.

```css
@theme {
  --color-brand-darkest: #173753;  /* Azul marino muy oscuro  */
  --color-brand-dark:    #1b4353;  /* Azul teal oscuro        */
  --color-brand:         #1D70A2;  /* Azul primario (acción)  */
  --color-brand-light:   #2892D7;  /* Azul claro (hover)      */
  --color-brand-muted:   #6DAEDB;  /* Azul suave (acento)     */
}
```

| Token Tailwind      | Hex       | Uso principal                                    |
| ------------------- | --------- | ------------------------------------------------ |
| `brand-darkest`     | `#173753` | Fondo del logo en sidebar admin                  |
| `brand-dark`        | `#1b4353` | Fondo del logo en sidebar team, texto activo     |
| `brand`             | `#1D70A2` | Botones primarios, nav activo, iconos principales|
| `brand-light`       | `#2892D7` | Estados hover, iconos secundarios                |
| `brand-muted`       | `#6DAEDB` | Iconos suaves, acentos de baja prioridad         |

Estas variables generan automáticamente todas las clases Tailwind: `bg-brand`, `text-brand-dark`, `bg-brand-light/15`, etc.

El `--primary` de shadcn/ui también está vinculado al brand (`#1D70A2`), por lo que todos los componentes shadcn (botones, anillos de foco, etc.) usan la paleta automáticamente.

### Colores semánticos (no modificar)

Estos colores no pertenecen a la paleta de marca pero se conservan por su significado universal:

| Color  | Clases Tailwind  | Uso                                           |
| ------ | ---------------- | --------------------------------------------- |
| Verde  | `emerald-*`      | Aprobado, inscrito, asistencia confirmada     |
| Rojo   | `red-*`          | Rechazado, eliminar, peligro                  |
| Ámbar  | `amber-*`        | Pendiente, advertencia                        |

### Cómo cambiar la paleta en el futuro

1. Abrir `apps/web/app/globals.css`
2. Editar los 5 valores hex en el bloque `@theme { ... }` al inicio del archivo
3. Guardar — toda la app se actualiza automáticamente en el siguiente build

No hay que tocar ningún otro archivo.

---

## 5. Arquitectura del Frontend — Componentes Reutilizables

El frontend sigue un patrón DRY estricto. Todos los componentes de aplicación (fuera de `ui/`) son reutilizables y se usan de forma consistente en todas las páginas.

### Componentes disponibles y cuándo usarlos

#### `PageHeader` — Cabecera de cualquier página

```tsx
import { PageHeader } from '@/components/page-header'

// Sin botón de acción
<PageHeader title="Equipos" description="Listado de equipos registrados" />

// Con botón de acción
<PageHeader
  title="Torneos"
  description="Gestiona los torneos de la liga"
  action={<Button asChild><Link href="/admin/torneos/new">Nuevo torneo</Link></Button>}
/>
```

#### `ListSkeleton` — Estado de carga de listas

```tsx
import { ListSkeleton } from '@/components/list-skeleton'

if (loading) return <ListSkeleton count={4} />  // count por defecto = 4
```

#### `EmptyState` — Estado vacío de listas

```tsx
import { EmptyState } from '@/components/empty-state'
import { Trophy } from 'lucide-react'

<EmptyState
  icon={Trophy}
  title="No hay torneos aún"
  description="Crea el primer torneo para empezar"
  action={<Button asChild><Link href="/admin/torneos/new">Nuevo torneo</Link></Button>}
/>
```

#### `EntityCard` — Card clicable para ítems de lista

```tsx
import { EntityCard } from '@/components/entity-card'

// ChevronRight se renderiza automáticamente al final
<EntityCard
  href={`/admin/torneos/${t.id}`}
  iconBg="bg-blue-50"
  icon={Trophy}
  iconColor="text-blue-600"
  title={t.nombre}
  subtitle="Torneo Apertura 2025"
  right={<Badge variant="outline">Activo</Badge>}
/>
```

#### `StatsCard` — Card de KPI para dashboards

```tsx
import { StatsCard } from '@/components/stats-card'

<StatsCard
  label="Torneos activos"
  value={kpis.torneos}
  icon={Trophy}
  iconBg="bg-blue-50"
  iconColor="text-blue-600"
  loading={loading}
/>
```

#### `ConfirmDialog` — Diálogo de confirmación para acciones destructivas

```tsx
import { ConfirmDialog } from '@/components/confirm-dialog'

<ConfirmDialog
  open={deleteOpen}
  onOpenChange={setDeleteOpen}
  title="Eliminar torneo"
  description="¿Estás seguro? Esta acción no se puede deshacer."
  onConfirm={handleDelete}
  loading={deleting}
  confirmLabel="Eliminar"  // opcional, default = 'Eliminar'
/>
```

#### `FormPage` — Wrapper para páginas de formulario (max-w-lg)

```tsx
import { FormPage } from '@/components/form-page'

// Incluye automáticamente: botón ArrowLeft, título y descripción
<FormPage
  title="Nuevo torneo"
  description="Completa los datos del torneo"
  backHref="/admin/torneos"
>
  <Card>...</Card>
</FormPage>
```

> **Nota**: `FormPage` usa `max-w-lg`. Para formularios más anchos (ej. crear equipo con fieldArray), construir la cabecera manualmente.

#### `extractApiError` — Extracción de mensajes de error de la API

```typescript
import { extractApiError } from '@/lib/utils'

// En cualquier bloque catch:
try {
  await api.post('/resource', data)
} catch (err) {
  toast.error(extractApiError(err, 'Error al crear'))
  // Si el fallback es 'Ha ocurrido un error' se puede omitir el segundo arg
}
```

### Patrón completo de una página de lista

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { ListSkeleton } from '@/components/list-skeleton'
import { EmptyState } from '@/components/empty-state'
import { EntityCard } from '@/components/entity-card'
import api from '@/lib/api'

export default function TorneosPage() {
  const [torneos, setTorneos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/tournaments').then(r => setTorneos(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <ListSkeleton count={3} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Torneos"
        description="Gestiona los torneos de la liga"
        action={
          <Button asChild>
            <a href="/admin/torneos/new"><Plus className="mr-2 h-4 w-4" />Nuevo torneo</a>
          </Button>
        }
      />
      {torneos.length === 0 ? (
        <EmptyState icon={Trophy} title="No hay torneos" description="Crea el primero" />
      ) : (
        <div className="space-y-3">
          {torneos.map(t => (
            <EntityCard
              key={t.id}
              href={`/admin/torneos/${t.id}`}
              iconBg="bg-blue-50"
              icon={Trophy}
              iconColor="text-blue-600"
              title={t.nombre}
              right={<Badge>Activo</Badge>}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 6. Instalación y Ejecución Local

### Requisitos

- Node.js ≥ 18
- pnpm v9 (`npm install -g pnpm`)
- PostgreSQL 17 instalado y corriendo

### Paso 1 — Instalar dependencias

```bash
pnpm install
```

### Paso 2 — Configurar la base de datos

Ejecutar en PostgreSQL (psql o pgAdmin):

```sql
CREATE USER liga_user WITH PASSWORD 'liga123';
CREATE DATABASE liga_iberica;
GRANT ALL PRIVILEGES ON DATABASE liga_iberica TO liga_user;
ALTER DATABASE liga_iberica OWNER TO liga_user;
```

### Paso 3 — Variables de entorno del backend

El archivo `apps/api/.env` ya existe con los valores de desarrollo:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=liga_user
DB_PASSWORD=liga123
DB_NAME=liga_iberica

JWT_SECRET=liga_iberica_secret_key_change_in_production_2024
JWT_EXPIRES_IN=7d

NODE_ENV=development
PORT=3001

FRONTEND_URL=http://localhost:3000
```

### Paso 4 — Variables de entorno del frontend

Crear `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Paso 5 — Iniciar en modo desarrollo

```bash
# Ambas apps a la vez (recomendado)
pnpm dev
```

O por separado:

```bash
# Backend (con hot-reload)
cd apps/api && pnpm dev

# Frontend
cd apps/web && pnpm dev
```

### Puertos

| Servicio     | URL                            |
| ------------ | ------------------------------ |
| Frontend     | http://localhost:3000          |
| Backend API  | http://localhost:3001          |
| Swagger Docs | http://localhost:3001/api/docs |

---

## 7. Datos de Prueba (Seed)

Al arrancar la API por primera vez con la base de datos vacía, el seeder crea automáticamente:

| Recurso       | Detalle                                              |
| ------------- | ---------------------------------------------------- |
| Usuarios      | 1 SUPER_ADMIN + 2 TEAM_ADMIN                         |
| Equipos       | Los Tigres (admin: Carlos) · Los Leones (admin: Ana) |
| Jugadores     | 8 por equipo (17 en total)                           |
| Sedes/Clubes  | Pabellón Municipal Centro · Polideportivo Norte      |
| Torneos       | Torneo Apertura 2025 · Torneo Clausura 2025          |
| Jornadas      | 3 jornadas del Torneo Apertura                       |
| Inscripciones | Ambos equipos inscritos en Torneo Apertura           |
| Pagos         | 3 pagos de ejemplo (1 aprobado, 2 pendientes)        |

**Credenciales de acceso:**

| Usuario     | Email           | Contraseña | Rol         |
| ----------- | --------------- | ---------- | ----------- |
| Super Admin | admin@liga.com  | admin123   | SUPER_ADMIN |
| Carlos      | carlos@liga.com | admin123   | TEAM_ADMIN  |
| Ana         | ana@liga.com    | admin123   | TEAM_ADMIN  |

> El seeder solo se ejecuta en `NODE_ENV=development` y únicamente si la base de datos está vacía.

---

## 8. Roles y Permisos

| Rol         | Descripción                                                             |
| ----------- | ----------------------------------------------------------------------- |
| SUPER_ADMIN | Gestiona torneos, jornadas, sedes, usuarios, pagos e invitados globales |
| TEAM_ADMIN  | Gestiona su(s) equipo(s), jugadores, asistencia e inscripciones propias |

El acceso por rol está protegido tanto en el frontend (`proxy.ts`) como en el backend (guards en cada endpoint).

---

## 9. Módulos de la API

| Módulo            | Endpoint base        | Descripción                |
| ----------------- | -------------------- | -------------------------- |
| Auth              | `/auth`              | Login, registro, perfil    |
| Users             | `/users`             | Gestión de usuarios        |
| Teams             | `/teams`             | Gestión de equipos         |
| Players           | `/players`           | Jugadores por equipo       |
| Clubs             | `/clubs`             | Sedes/pabellones           |
| Tournaments       | `/tournaments`       | Torneos                    |
| Match Days        | `/match-days`        | Jornadas de torneos        |
| Tournament Teams  | `/tournament-teams`  | Inscripciones de equipos   |
| Player Match Days | `/player-match-days` | Asistencia de jugadores    |
| Guest People      | `/guest-people`      | Invitados a jornadas       |
| Payments          | `/payments`          | Pagos de inscripción       |

La documentación interactiva completa está en: **http://localhost:3001/api/docs**

---

## 10. Comandos Útiles

```bash
# Desarrollo (ambas apps)
pnpm dev

# Build de producción
pnpm build

# Lint (0 warnings garantizado)
pnpm lint

# TypeScript check — web
npx tsc --noEmit -p apps/web/tsconfig.json

# TypeScript check — api
npx tsc --noEmit -p apps/api/tsconfig.json
```

---

## 11. Troubleshooting

### "password authentication failed"
Verificar que el usuario PostgreSQL existe y la contraseña coincide con el `.env`.

### "Cannot find module dist/src/main"
Ejecutar `pnpm build` dentro de `apps/api` antes de iniciar.

### "Port 3001 already in use"
```bash
# Windows
taskkill /F /IM node.exe
```

### "Unauthorized" en Swagger
Pegar el token sin el prefijo `Bearer ` — Swagger lo añade automáticamente.

### La API no crea tablas al iniciar
TypeORM está configurado con `synchronize: true` en desarrollo. Verificar que la base de datos existe y que las credenciales son correctas.

### "useSearchParams() should be wrapped in suspense"
Envolver el componente que usa `useSearchParams()` en `<Suspense>` con un componente hijo separado (ver AGENTS.md §5.2).

### "Both middleware file and proxy file are detected"
Eliminar `middleware.ts`. En Next.js 16 solo debe existir `proxy.ts`.
