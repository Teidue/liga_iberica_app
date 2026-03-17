# AGENTS.md — Liga Ibérica Portal

Guía completa y autoritativa para agentes IA que trabajen en este proyecto.
Lee este archivo antes de tocar cualquier código.

---

## 1. Información del Proyecto

| Campo | Valor |
|-------|-------|
| Nombre | Liga Ibérica Portal |
| Descripción | Sistema de gestión de torneos de fútbol sala |
| Tipo | Monorepo Turborepo |
| Frontend | Next.js **16.1.5** (React 19, TypeScript **5.9.2**) |
| Backend | NestJS **11** (TypeScript) |
| Base de datos | PostgreSQL 17 |
| ORM | TypeORM **0.3.28** |
| CSS | Tailwind CSS **4** (sintaxis v4 — `@import "tailwindcss"`) |
| Autenticación | JWT + Passport |
| Package manager | pnpm v9 |

---

## 2. Estado Actual del Proyecto

| Verificación | Estado |
|--------------|--------|
| `pnpm lint` (0 warnings) | ✅ |
| `tsc --noEmit` web (0 errores) | ✅ |
| `tsc --noEmit` api (0 errores) | ✅ |
| `next build` (0 errores) | ✅ |
| `nest build` (0 errores) | ✅ |
| Refactor DRY frontend | ✅ |
| Revisión UI/UX + accesibilidad | ✅ |

### Historial de sesiones completadas

**Sesión 1 — Backend completo**
- API NestJS 11 con todos los módulos: auth, users, teams, players, clubs, tournaments, match-days, player-match-days, tournament-teams, payments, guest-people
- Guards de autenticación JWT y autorización por rol (SUPER_ADMIN / TEAM_ADMIN)
- Seeder automático de datos de prueba (solo dev, solo si BD vacía)
- Documentación Swagger en `/api/docs`

**Sesión 2 — Frontend completo**
- Todas las páginas del área admin (`/admin/*`) y team (`/team/*`)
- Protección de rutas con `proxy.ts` (Next.js 16)
- Contexto de autenticación global (`useAuth`)
- Sidebars responsive (desktop + drawer móvil)
- Formularios con react-hook-form + Zod
- Notificaciones toast con Sonner

**Sesión 3 — Refactor DRY del frontend**
- Extraídos patrones repetidos en 20+ páginas en componentes reutilizables
- Creados: `BaseSidebar`, `PageHeader`, `ListSkeleton`, `EmptyState`, `EntityCard`, `StatsCard`, `ConfirmDialog`, `FormPage`
- Sin cambio de comportamiento ni lógica

**Sesión 4 — Revisión UI/UX**
- `page-header.tsx`: eliminado bloque JSX duplicado (DRY)
- `torneos/[id]/page.tsx`: eliminado `<Separator />` huérfano + `aria-label` en botón delete
- `clubes/[id]/page.tsx`: `aria-label` en botón delete
- `jornadas/[id]/page.tsx`: `aria-label` en botón delete
- `form-page.tsx`: `aria-label="Volver"` en botón de retroceso (aplica a todos los formularios)

---

## 3. Estructura del Proyecto

```
liga_iberica_app/
├── apps/
│   ├── web/                          # Frontend Next.js (puerto 3000)
│   │   ├── app/
│   │   │   ├── (admin)/admin/        # Rutas exclusivas SUPER_ADMIN
│   │   │   │   ├── page.tsx          # Dashboard con KPIs (StatsCard)
│   │   │   │   ├── clubes/           # CRUD + config formato Excel
│   │   │   │   ├── equipos/          # Listado + detalle
│   │   │   │   ├── invitados/        # Listado + detalle de invitados
│   │   │   │   ├── jornadas/         # CRUD + toggle cerrado + export XLSX
│   │   │   │   ├── pagos/            # Tabs + aprobar/rechazar
│   │   │   │   ├── perfil/           # Edición perfil admin
│   │   │   │   ├── torneos/          # CRUD + inscripciones + jornadas
│   │   │   │   └── usuarios/         # CRUD + dos formularios (info + password)
│   │   │   ├── (auth)/login/page.tsx # Login público con escena Three.js
│   │   │   ├── (team)/team/          # Rutas exclusivas TEAM_ADMIN
│   │   │   │   ├── page.tsx          # Dashboard del equipo
│   │   │   │   ├── asistencia/       # Lista + registro por jornada
│   │   │   │   ├── pagos/            # Lista + nuevo pago
│   │   │   │   ├── perfil/           # Edición perfil team admin
│   │   │   │   ├── teams/            # CRUD equipos + jugadores
│   │   │   │   └── torneos/          # Lista + inscripción
│   │   │   ├── layout.tsx            # Root: Montserrat, AuthProvider, Toaster
│   │   │   └── page.tsx              # → redirect /login
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui — NO modificar
│   │   │   ├── sidebar.tsx           # BaseSidebar (accent: 'indigo'|'emerald')
│   │   │   ├── admin-sidebar.tsx     # Config nav SUPER_ADMIN → BaseSidebar
│   │   │   ├── team-sidebar.tsx      # Config nav TEAM_ADMIN → BaseSidebar
│   │   │   ├── page-header.tsx       # Título + acción opcional
│   │   │   ├── list-skeleton.tsx     # Skeleton de carga
│   │   │   ├── empty-state.tsx       # Estado vacío con icono y CTA
│   │   │   ├── entity-card.tsx       # Card clicable para listas
│   │   │   ├── stats-card.tsx        # Card KPI para dashboards
│   │   │   ├── confirm-dialog.tsx    # Confirmación destructiva
│   │   │   ├── form-page.tsx         # Wrapper formulario max-w-lg
│   │   │   └── login-scene.tsx       # Three.js: trofeo + balón + partículas
│   │   ├── contexts/auth-context.tsx # Estado JWT global (useAuth)
│   │   ├── lib/
│   │   │   ├── api.ts                # Axios + interceptor JWT + redirect 401
│   │   │   ├── types.ts              # Tipos del dominio
│   │   │   └── utils.ts              # cn(), isAxiosError(), extractApiError()
│   │   ├── proxy.ts                  # Protección de rutas Next.js 16
│   │   └── next.config.js
│   │
│   └── api/                          # Backend NestJS (puerto 3001)
│       └── src/
│           ├── main.ts               # Bootstrap: ValidationPipe, CORS, Swagger
│           ├── app.module.ts         # Módulo raíz + TypeORM config
│           ├── data-source.ts        # DataSource para CLI de migraciones
│           ├── auth/                 # JWT strategy, guards, roles.decorator
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
│           ├── seed/                 # SeedService (OnApplicationBootstrap)
│           └── common/
│               ├── entities/         # BaseEntity (UUID pk, timestamps)
│               └── enums/            # UserRole, PaymentMethod, PaymentStatus
│
├── packages/
│   ├── ui/                    # Stubs compartidos
│   ├── eslint-config/
│   └── typescript-config/
│
├── turbo.json
├── pnpm-workspace.yaml
├── liga_iberica_test_plan.md  # Plan de pruebas manuales 50 pasos
├── AGENTS.md
├── CLAUDE.md
└── README.md
```

---

## 4. Componentes Reutilizables del Frontend

**REGLA CRÍTICA:** Toda página nueva DEBE usar estos componentes. No reinventar patrones existentes.

### 4.1 Interfaces y uso

#### `PageHeader` — `@/components/page-header`

```tsx
interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

<PageHeader
  title="Torneos"
  description="Gestiona los torneos"
  action={<Button asChild><Link href="/admin/torneos/new">Nuevo</Link></Button>}
/>
```

#### `ListSkeleton` — `@/components/list-skeleton`

```tsx
interface ListSkeletonProps { count?: number }  // default = 4

if (loading) return <ListSkeleton count={3} />
```

#### `EmptyState` — `@/components/empty-state`

```tsx
<EmptyState
  icon={Trophy}
  title="No hay torneos aún"
  description="Crea el primero para empezar"
  action={<Button asChild><Link href="/admin/torneos/new">Nuevo torneo</Link></Button>}
/>
```

#### `EntityCard` — `@/components/entity-card`

ChevronRight se renderiza automáticamente. No añadirlo manualmente.

```tsx
<EntityCard
  href={`/admin/torneos/${t.id}`}
  iconBg="bg-brand/10"
  icon={Trophy}
  iconColor="text-brand"
  title={t.nombre}
  subtitle={`${fechaInicio} — ${fechaFin}`}
  right={<Badge variant="outline">Activo</Badge>}
/>
```

#### `StatsCard` — `@/components/stats-card`

```tsx
<StatsCard
  label="Torneos activos"
  value={stats.count}
  icon={Trophy}
  iconBg="bg-brand/10"
  iconColor="text-brand"
  loading={loading}
/>
```

#### `ConfirmDialog` — `@/components/confirm-dialog`

El botón confirm es siempre `variant="destructive"`. No usar para aprobar/rechazar.

```tsx
<ConfirmDialog
  open={deleteOpen}
  onOpenChange={setDeleteOpen}
  title="Eliminar torneo"
  description={<>¿Seguro que deseas eliminar <strong>{nombre}</strong>?</>}
  onConfirm={handleDelete}
  loading={deleting}
/>
```

> **EXCEPCIÓN:** `admin/pagos/[id]` usa Dialog personalizado (aprobar + rechazar tienen semánticas distintas).

#### `FormPage` — `@/components/form-page`

Incluye `aria-label="Volver"` en el botón de retroceso. Limita ancho a `max-w-lg`.

```tsx
<FormPage title="Nuevo torneo" description="Completa los datos" backHref="/admin/torneos">
  <Card>
    <CardContent className="pt-6">{/* form */}</CardContent>
  </Card>
</FormPage>
```

> **EXCEPCIÓN:** `team/teams/new` usa `max-w-2xl` (FieldArray de jugadores) — construir cabecera manualmente.

#### `BaseSidebar` — `@/components/sidebar`

```tsx
type AccentColor = 'indigo' | 'emerald'

// Para añadir un nuevo portal:
export function NuevoSidebar() {
  return (
    <BaseSidebar
      navItems={NAV_ITEMS}
      accent="indigo"
      brandIcon={Shield}
      brandRole="Nuevo Rol"
      profileHref="/nuevo/perfil"
      dashboardHref="/nuevo"    // match exacto, no startsWith
      defaultInitials="NR"
    />
  )
}
```

### 4.2 `extractApiError` — Obligatorio en catch blocks

```typescript
// CORRECTO — usar siempre
catch (err) {
  toast.error(extractApiError(err, 'Error al crear'))
}

// INCORRECTO — nunca hacer esto manualmente
catch (err) {
  const msg = isAxiosError(err) ? err.response?.data?.message ?? 'Error' : 'Error'
  toast.error(msg)
}
```

### 4.3 Patrón completo de página de lista

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
        <EmptyState icon={Trophy} title="No hay torneos aún" />
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

### 4.4 Patrón completo de página de formulario

```tsx
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { FormPage } from '@/components/form-page'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'

const schema = z.object({ nombre: z.string().min(2, 'Mínimo 2 caracteres') })
type FormValues = z.infer<typeof schema>

export default function NewEntityPage() {
  const router = useRouter()
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { nombre: '' } })

  async function onSubmit(values: FormValues) {
    try {
      await api.post('/resource', values)
      toast.success('Creado correctamente')
      router.push('/admin/resource')
    } catch (err) {
      toast.error(extractApiError(err, 'Error al crear'))
    }
  }

  return (
    <FormPage title="Nueva entidad" description="Completa los datos" backHref="/admin/resource">
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-3 pt-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/admin/resource">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="flex-1">
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </FormPage>
  )
}
```

---

## 5. Convenciones de Código

### 5.1 General

| Aspecto | Convención |
|---------|------------|
| Lenguaje | TypeScript strict mode en ambas apps |
| Package manager | pnpm v9 |
| Node | ≥ 18 |
| Indentación | 2 espacios |
| Fin de línea | LF |
| Quotes | Single quotes en TS/TSX, double quotes en atributos JSX |

### 5.2 Naming

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Archivos | kebab-case | `user-controller.ts`, `entity-card.tsx` |
| Clases | PascalCase | `UserController`, `TournamentService` |
| Métodos / funciones | camelCase | `createUser`, `getTournamentById` |
| Variables | camelCase | `userName`, `tournamentId` |
| Constantes | UPPER_SNAKE_CASE | `MAX_PLAYERS_PER_TEAM` |
| Enums | PascalCase | `UserRole`, `PaymentStatus` |

### 5.3 TypeScript — Reglas estrictas

- **Nunca usar `any`**. Siempre tipar explícitamente.
- Para columnas JSON de TypeORM usar `unknown` con type guard:

```typescript
// ✅ CORRECTO
validateFormat(format: unknown): boolean {
  if (typeof format !== 'object' || format === null) throw new ConflictException('...')
  const record = format as Record<string, unknown>
  // ...
}
```

### 5.4 Enums del dominio

```typescript
// apps/api/src/common/enums/index.ts
enum UserRole    { SUPER_ADMIN = 'SUPER_ADMIN', TEAM_ADMIN = 'TEAM_ADMIN' }
enum PaymentMethod { BINANCE = 'BINANCE', ZINLI = 'ZINLI', TRANSFERENCIA = 'TRANSFERENCIA', EFECTIVO = 'EFECTIVO', OTRO = 'OTRO' }
enum PaymentStatus { PENDING = 'pending', APPROVED = 'approved', REJECTED = 'rejected' }
```

**IMPORTANTE:** Comparar siempre usando el enum:

```typescript
// ✅ CORRECTO
if (payment.status === PaymentStatus.PENDING) { ... }

// ❌ INCORRECTO — genera error @typescript-eslint/no-unsafe-enum-comparison
if (payment.status === 'pending') { ... }
```

---

## 6. NestJS — Patrones del Proyecto

### 6.1 Estructura de un módulo

```
module-name/
├── dto/module-name.dto.ts      # Create + Update + Response DTOs en un archivo
├── entities/module-name.entity.ts
├── module-name.controller.ts
├── module-name.service.ts
└── module-name.module.ts
```

### 6.2 Patrón de Controller

```typescript
@ApiTags('nombre')
@ApiBearerAuth()
@Controller('nombre')
@UseGuards(JwtAuthGuard)
export class NombreController {
  constructor(private readonly service: NombreService) {}

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ResponseDto> {
    return this.service.findOne(id)
    // No incluir @Request() req si no se usa en este método
  }
}
```

### 6.3 Patrón de Service

```typescript
@Injectable()
export class NombreService {
  constructor(
    @InjectRepository(Entidad)
    private repository: Repository<Entidad>,
  ) {}

  async findOne(id: string): Promise<Entidad> {
    const entity = await this.repository.findOne({ where: { id } })
    if (!entity) throw new NotFoundException(`Entidad con ID ${id} no encontrada`)
    return entity
  }
}
```

### 6.4 Columnas UUID en TypeORM

```typescript
// ❌ INCORRECTO
@Column({ type: 'varchar', length: 36 })
tournamentId: string

// ✅ CORRECTO
@Column({ type: 'uuid' })
tournamentId: string
```

---

## 7. Next.js 16 — Patrones Obligatorios

### 7.1 `proxy.ts` en lugar de `middleware.ts`

En Next.js 16 el archivo de protección de rutas se llama `proxy.ts`. **No pueden coexistir ambos.**

```typescript
// apps/web/proxy.ts
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) { /* ... */ }

export const config = { matcher: ['/admin/:path*', '/team/:path*', '/login'] }
```

### 7.2 `useSearchParams()` requiere Suspense

```tsx
// ❌ INCORRECTO — falla en build de producción
export default function MyPage() {
  const searchParams = useSearchParams()
}

// ✅ CORRECTO — componente hijo con Suspense wrapper
function MyPageContent() {
  const searchParams = useSearchParams()
  // ...
}

export default function MyPage() {
  return <Suspense><MyPageContent /></Suspense>
}
```

**En este proyecto:** `admin/jornadas/new/page.tsx` usa este patrón (componente `NewJornadaForm` como hijo).

### 7.3 Inputs numéricos con react-hook-form + Zod

**Nunca usar `z.coerce.number()`** — rompe los genéricos de `Resolver<TFieldValues>`.

```typescript
// ❌ INCORRECTO
monto: z.coerce.number().positive()

// ✅ CORRECTO — schema
monto: z.number().positive()

// ✅ CORRECTO — JSX
<Input
  type="number"
  name={field.name}
  ref={field.ref}
  value={field.value}
  onBlur={field.onBlur}
  onChange={e => field.onChange(e.target.valueAsNumber)}
/>
```

### 7.4 Acceso seguro a arrays

```typescript
// ❌ TypeScript: "Object is possibly undefined"
if (arr.length === 1) doSomething(arr[0].id)

// ✅ CORRECTO
const [first] = arr
if (arr.length === 1 && first) doSomething(first.id)
```

### 7.5 `react-hooks/exhaustive-deps`

El comentario de disable debe ir **dentro del callback**, justo antes del array:

```typescript
// ✅ CORRECTO
useEffect(() => {
  api.get(`/resource/${id}`).then(r => setState(r.data))
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [id])
```

### 7.6 Tailwind CSS v4

Este proyecto usa Tailwind **v4**. Diferencias clave respecto a v3:

```css
/* ✅ v4 — importación directa */
@import "tailwindcss";

/* ❌ v3 — no usar */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```html
<!-- ✅ v4 — gradientes -->
<div class="bg-linear-to-br from-brand-darkest to-slate-900">

<!-- ❌ v3 — no usar -->
<div class="bg-gradient-to-br from-brand-darkest to-slate-900">
```

Los tokens de color personalizados se definen en `globals.css` con `@theme { }`.

---

## 8. Autenticación y Autorización

### 8.1 Flujo JWT

1. `POST /auth/login` → recibe `{ access_token, user }`
2. Token guardado en `localStorage` y cookie `SameSite=Strict` (TTL 7d)
3. Axios interceptor: añade `Authorization: Bearer <token>` a cada request
4. `proxy.ts`: lee cookie para proteger rutas server-side
5. Respuesta 401: limpia auth y redirige a `/login`

### 8.2 Roles

| Rol | Frontend | Backend |
|-----|----------|---------|
| `SUPER_ADMIN` | `/admin/*` | Acceso global |
| `TEAM_ADMIN` | `/team/*` | Solo sus recursos propios |

### 8.3 `useAuth` hook

```typescript
const { user, login, logout, isLoading } = useAuth()
// user: { id, nombre, email, rol } | null
```

---

## 9. Variables de Entorno

### Backend — `apps/api/.env`

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

### Frontend — `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 10. Comandos de Desarrollo

### Nivel raíz

```bash
pnpm install          # Instalar dependencias
pnpm dev              # Ambas apps en desarrollo
pnpm build            # Build de producción
pnpm lint             # ESLint con --max-warnings 0
```

### TypeScript check

```bash
npx tsc --noEmit -p apps/web/tsconfig.json   # Frontend
npx tsc --noEmit -p apps/api/tsconfig.json   # Backend
```

> `pnpm check-types` solo aplica a `@repo/ui`. Para web y api usar los comandos anteriores.

### Backend

```bash
cd apps/api
pnpm dev              # Hot-reload con ts-node
pnpm build            # Compila a dist/
node dist/main        # Ejecutar compilado
```

### Frontend

```bash
cd apps/web
pnpm dev              # Puerto 3000
pnpm build            # Build de producción
pnpm start            # Iniciar build
```

---

## 11. API Endpoints

### Autenticación

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | /auth/login | No | Inicio de sesión |
| POST | /auth/register | No | Registro |
| GET | /auth/profile | JWT | Perfil del usuario |

### Usuarios

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| POST | /users | — | Crear usuario |
| GET | /users | SUPER_ADMIN | Listar usuarios |
| GET | /users/:id | — | Ver usuario |
| PATCH | /users/:id | — | Actualizar usuario |
| DELETE | /users/:id | SUPER_ADMIN | Eliminar usuario |

### Equipos

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| POST | /teams | — | Crear equipo |
| GET | /teams | — | Listar equipos |
| GET | /teams/my | TEAM_ADMIN | Mis equipos |
| GET | /teams/:id | — | Ver equipo |
| PATCH | /teams/:id | — | Actualizar equipo |
| DELETE | /teams/:id | SUPER_ADMIN | Eliminar equipo |

### Jugadores

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /players | Crear jugador |
| GET | /players | Listar jugadores |
| GET | /players/team/:teamId | Jugadores de un equipo |
| GET | /players/search?q= | Buscar jugador |
| GET | /players/:id | Ver jugador |
| PATCH | /players/:id | Actualizar jugador |
| DELETE | /players/:id | Eliminar jugador |

### Clubes (Sedes)

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| POST | /clubs | SUPER_ADMIN | Crear sede |
| GET | /clubs | SUPER_ADMIN | Listar sedes |
| GET | /clubs/with-excel-format | SUPER_ADMIN | Sedes con formato Excel |
| GET | /clubs/default-excel-format | SUPER_ADMIN | Formato Excel default |
| GET | /clubs/:id | SUPER_ADMIN | Ver sede |
| PATCH | /clubs/:id | SUPER_ADMIN | Actualizar sede |
| DELETE | /clubs/:id | SUPER_ADMIN | Eliminar sede |

### Torneos

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| POST | /tournaments | SUPER_ADMIN | Crear torneo |
| GET | /tournaments | — | Listar torneos |
| GET | /tournaments/active | — | Torneos activos |
| GET | /tournaments/upcoming | — | Próximos torneos |
| GET | /tournaments/past | — | Torneos finalizados |
| GET | /tournaments/:id | — | Ver torneo |
| PATCH | /tournaments/:id | SUPER_ADMIN | Actualizar torneo |
| DELETE | /tournaments/:id | SUPER_ADMIN | Eliminar torneo |

### Jornadas

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| POST | /match-days | SUPER_ADMIN | Crear jornada |
| GET | /match-days | — | Listar jornadas |
| GET | /match-days/upcoming | — | Próximas jornadas |
| GET | /match-days/:id | — | Ver jornada |
| PATCH | /match-days/:id | SUPER_ADMIN | Actualizar / toggle cerrado |
| DELETE | /match-days/:id | SUPER_ADMIN | Eliminar jornada |

### Inscripciones (TournamentTeams)

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| POST | /tournament-teams | TEAM_ADMIN | Inscribir equipo |
| GET | /tournament-teams | SUPER_ADMIN | Listar inscripciones |
| GET | /tournament-teams/balance/:id | SUPER_ADMIN | Deuda restante |
| GET | /tournament-teams/:id | — | Ver inscripción |
| PATCH | /tournament-teams/:id | SUPER_ADMIN | Actualizar inscripción |
| DELETE | /tournament-teams/:id | SUPER_ADMIN | Eliminar inscripción |

### Asistencia (PlayerMatchDays)

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| POST | /player-match-days | TEAM_ADMIN | Registrar asistencia |
| POST | /player-match-days/bulk | TEAM_ADMIN | Asistencia masiva |
| GET | /player-match-days | SUPER_ADMIN | Listar asistencia |
| GET | /player-match-days/team/:matchDayId | TEAM_ADMIN | Asistencia de mi equipo |
| GET | /player-match-days/stats/:matchDayId | SUPER_ADMIN | Estadísticas de jornada |
| GET | /player-match-days/:id | — | Ver registro |
| PATCH | /player-match-days/:id | TEAM_ADMIN | Actualizar asistencia |
| DELETE | /player-match-days/:id | SUPER_ADMIN | Eliminar registro |

### Invitados (GuestPeople)

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| POST | /guest-people | — | Crear invitado |
| GET | /guest-people | SUPER_ADMIN | Listar invitados |
| GET | /guest-people/by-documento/:doc | — | Buscar por documento |
| GET | /guest-people/:id | — | Ver invitado |
| PATCH | /guest-people/:id | TEAM_ADMIN | Actualizar invitado |
| DELETE | /guest-people/:id | TEAM_ADMIN | Eliminar invitado |

### Pagos

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| POST | /payments | TEAM_ADMIN | Registrar pago |
| GET | /payments | SUPER_ADMIN | Listar todos los pagos |
| GET | /payments/pending | SUPER_ADMIN | Pagos pendientes |
| GET | /payments/approved | SUPER_ADMIN | Pagos aprobados |
| GET | /payments/rejected | SUPER_ADMIN | Pagos rechazados |
| GET | /payments/:id | — | Ver pago |
| POST | /payments/:id/approve | SUPER_ADMIN | Aprobar pago |
| POST | /payments/:id/reject | SUPER_ADMIN | Rechazar pago |
| PATCH | /payments/:id | SUPER_ADMIN | Actualizar pago |
| DELETE | /payments/:id | SUPER_ADMIN | Eliminar pago |

---

## 12. Seeder Automático

`apps/api/src/seed/seed.service.ts` — `OnApplicationBootstrap`:

- Si `NODE_ENV === 'production'` → no ejecuta
- Si la tabla `users` tiene registros → no ejecuta
- Si la BD está vacía → crea dataset completo de desarrollo

**Datos creados:** 3 usuarios, 2 sedes, 2 torneos, 2 equipos, 17 jugadores, 3 jornadas, 2 inscripciones, 3 pagos.

**Credenciales:** `admin@liga.com`, `carlos@liga.com`, `ana@liga.com` — password: `admin123`.

---

## 13. Errores Comunes y Soluciones

| Síntoma | Causa | Solución |
|---------|-------|----------|
| `password authentication failed` | Credenciales PG incorrectas | Verificar `apps/api/.env` |
| `Column does not support length property` | Columna UUID mal definida | Usar `type: 'uuid'` en lugar de `varchar(36)` |
| `Port already in use` | Proceso previo activo | Windows: `taskkill /F /IM node.exe` |
| `Cannot find module dist/src/main` | No compilado | `pnpm build` dentro de `apps/api` |
| `useSearchParams() should be wrapped in suspense` | Falta Suspense | Ver §7.2 |
| `Both middleware file and proxy file are detected` | Coexisten ambos archivos | Eliminar `middleware.ts` |
| Tipos incorrectos con `z.coerce.number()` | Incompatibilidad con Resolver | Usar `z.number()` + `valueAsNumber` (ver §7.3) |
| `no-unsafe-enum-comparison` | Comparación contra string literal | Comparar contra valor del enum (ver §5.4) |
| Tailwind clase `bg-gradient-to-*` no funciona | Sintaxis v3 en proyecto v4 | Usar `bg-linear-to-*` (v4) |

---

## 14. Git Workflow

### Conventional Commits

| Prefijo | Uso |
|---------|-----|
| `feat:` | Nueva funcionalidad |
| `fix:` | Bug fix |
| `docs:` | Documentación |
| `refactor:` | Refactorización sin cambio de comportamiento |
| `test:` | Tests |
| `chore:` | Tareas menores (deps, config) |

### Flujo

```bash
# 1. Crear rama desde main
git checkout -b feat/nombre-feature

# 2. Desarrollar y verificar calidad
pnpm lint
npx tsc --noEmit -p apps/web/tsconfig.json
npx tsc --noEmit -p apps/api/tsconfig.json

# 3. Commit y push
git commit -m "feat: descripción del cambio"
git push origin feat/nombre-feature

# 4. Pull Request hacia main
```
