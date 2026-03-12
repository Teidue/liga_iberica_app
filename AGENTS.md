# AGENTS.md - Liga Ibérica Portal

Guía completa para agentes IA que trabajen en este proyecto.

---

## 1. Información del Proyecto

| Campo         | Valor                                        |
| ------------- | -------------------------------------------- |
| Nombre        | Liga Ibérica Portal                          |
| Descripción   | Sistema de gestión de torneos de fútbol sala |
| Tipo          | Monorepo Turborepo                           |
| Frontend      | Next.js 16 (React 19, TypeScript)            |
| Backend       | NestJS (TypeScript)                          |
| Base de datos | PostgreSQL 17                                |
| ORM           | TypeORM 0.3                                  |
| Autenticación | JWT + Passport                               |

---

## 2. Estado Actual del Proyecto

| Verificación                    | Estado |
| ------------------------------- | ------ |
| `pnpm lint` (0 warnings)        | ✅     |
| `tsc --noEmit` web (0 errores)  | ✅     |
| `tsc --noEmit` api (0 errores)  | ✅     |
| `next build` (0 errores)        | ✅     |
| `nest build` (0 errores)        | ✅     |
| Refactor DRY frontend           | ✅     |

### Historial de trabajo completado

#### Sesión 1 — Backend completo
- API NestJS con todos los módulos: auth, users, teams, players, clubs, tournaments, match-days, player-match-days, tournament-teams, payments, guest-people
- Autenticación JWT con guards por rol (SUPER_ADMIN / TEAM_ADMIN)
- Seeder automático de datos de prueba (solo en dev, solo si BD vacía)
- Documentación Swagger en `/api/docs`
- 0 errores TypeScript, 0 warnings ESLint

#### Sesión 2 — Frontend completo
- Todas las páginas del área admin (`/admin/*`) y team (`/team/*`)
- Protección de rutas con `proxy.ts` (Next.js 16)
- Contexto de autenticación global (`useAuth`)
- Sidebars con diseño responsive (desktop + drawer móvil)
- Formularios con react-hook-form + Zod
- Notificaciones toast con Sonner

#### Sesión 3 — Refactor DRY del frontend (COMPLETADO)
Se extrajeron patrones repetidos en 20+ páginas en componentes reutilizables. **No cambió ningún comportamiento ni lógica.**

**Nuevos componentes creados:**
- `components/sidebar.tsx` — `BaseSidebar` compartido
- `components/page-header.tsx` — `PageHeader`
- `components/list-skeleton.tsx` — `ListSkeleton`
- `components/empty-state.tsx` — `EmptyState`
- `components/entity-card.tsx` — `EntityCard`
- `components/stats-card.tsx` — `StatsCard`
- `components/confirm-dialog.tsx` — `ConfirmDialog`
- `components/form-page.tsx` — `FormPage`

**Archivos refactorizados:**
- `components/admin-sidebar.tsx` → ahora es una config delgada que usa `BaseSidebar`
- `components/team-sidebar.tsx` → ídem con acento `emerald`
- `lib/utils.ts` → añadida función `extractApiError`
- Todas las páginas de lista del admin y team (8 admin + 5 team)
- Todas las páginas de formulario del admin y team (7 admin + 5 team)
- Todas las páginas de detalle con diálogos de confirmación (6 admin)
- Corrección de bug en backend: `tournament-teams.service.ts` línea 252 — comparación `p.status === 'pending'` reemplazada por `p.status === PaymentStatus.PENDING`

---

## 3. Estructura Real del Proyecto

```
liga_iberica_portal/
├── apps/
│   ├── web/                          # Frontend Next.js (puerto 3000)
│   │   ├── app/
│   │   │   ├── (admin)/admin/        # Rutas exclusivas SUPER_ADMIN
│   │   │   │   ├── page.tsx          # Dashboard con KPIs (StatsCard)
│   │   │   │   ├── clubes/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── edit/page.tsx
│   │   │   │   ├── equipos/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── invitados/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── jornadas/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx  # Suspense por useSearchParams
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx  # XLSX + toggleCerrado + ConfirmDialog
│   │   │   │   │       └── edit/page.tsx
│   │   │   │   ├── pagos/
│   │   │   │   │   ├── page.tsx      # Tabs + StatsCard
│   │   │   │   │   └── [id]/page.tsx # Dialog personalizado (approve/reject)
│   │   │   │   ├── perfil/page.tsx
│   │   │   │   ├── torneos/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── edit/page.tsx
│   │   │   │   └── usuarios/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── new/page.tsx
│   │   │   │       └── [id]/
│   │   │   │           ├── page.tsx
│   │   │   │           └── edit/page.tsx  # Dos formularios (info + password)
│   │   │   ├── (auth)/login/page.tsx      # Login público
│   │   │   ├── (team)/team/          # Rutas exclusivas TEAM_ADMIN
│   │   │   │   ├── page.tsx          # Dashboard del equipo
│   │   │   │   ├── asistencia/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [matchDayId]/page.tsx
│   │   │   │   ├── pagos/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── new/page.tsx
│   │   │   │   ├── perfil/page.tsx
│   │   │   │   ├── teams/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx       # max-w-2xl, NO usa FormPage
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       ├── edit/page.tsx
│   │   │   │   │       └── players/
│   │   │   │   │           ├── new/page.tsx
│   │   │   │   │           └── [playerId]/edit/page.tsx
│   │   │   │   └── torneos/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [tournamentId]/inscribir/page.tsx
│   │   │   ├── layout.tsx            # Root layout (Toaster, AuthProvider)
│   │   │   └── page.tsx              # Redirect a /login
│   │   ├── components/
│   │   │   ├── ui/                   # Componentes shadcn/ui (NO modificar)
│   │   │   ├── sidebar.tsx           # BaseSidebar (compartido, acepta accent)
│   │   │   ├── admin-sidebar.tsx     # Config SUPER_ADMIN → usa BaseSidebar
│   │   │   ├── team-sidebar.tsx      # Config TEAM_ADMIN → usa BaseSidebar
│   │   │   ├── page-header.tsx       # Cabecera de página
│   │   │   ├── list-skeleton.tsx     # Skeleton de listas
│   │   │   ├── empty-state.tsx       # Estado vacío
│   │   │   ├── entity-card.tsx       # Card clicable para listas
│   │   │   ├── stats-card.tsx        # Card KPI para dashboards
│   │   │   ├── confirm-dialog.tsx    # Diálogo de confirmación
│   │   │   └── form-page.tsx         # Wrapper formulario max-w-lg
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
│           ├── seed/                 # SeedService (auto-seed en dev)
│           ├── common/
│           │   ├── entities/         # BaseEntity
│           │   └── enums/            # UserRole, PaymentMethod, PaymentStatus
│           ├── app.module.ts
│           ├── main.ts
│           └── data-source.ts
│
├── packages/
│   ├── ui/                    # Componentes compartidos (pocas piezas)
│   ├── eslint-config/
│   └── typescript-config/
│
├── turbo.json
├── pnpm-workspace.yaml
├── AGENTS.md
├── CLAUDE.md
└── README.md
```

---

## 4. Componentes Reutilizables del Frontend

**REGLA CRÍTICA**: Cualquier página nueva DEBE usar estos componentes. No reinventar patrones que ya existen.

### 4.1 Interfaces y uso

#### `PageHeader` — `@/components/page-header`

```tsx
interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode  // botón o cualquier elemento a la derecha
}

// Sin acción (solo título):
<PageHeader title="Equipos" description="Equipos registrados en la liga" />

// Con botón de acción:
<PageHeader
  title="Torneos"
  action={<Button asChild><Link href="/admin/torneos/new">Nuevo</Link></Button>}
/>
```

#### `ListSkeleton` — `@/components/list-skeleton`

```tsx
interface ListSkeletonProps {
  count?: number  // default = 4
}

if (loading) return <ListSkeleton count={3} />
```

#### `EmptyState` — `@/components/empty-state`

```tsx
interface EmptyStateProps {
  icon: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}

<EmptyState
  icon={Trophy}
  title="No hay torneos aún"
  description="Crea el primero para empezar"
  action={<Button asChild><Link href="/admin/torneos/new">Nuevo torneo</Link></Button>}
/>
```

#### `EntityCard` — `@/components/entity-card`

```tsx
interface EntityCardProps {
  href: string
  iconBg: string           // ej. 'bg-blue-50'
  icon: React.ElementType  // acepta valor dinámico: icon={u.rol === 'SUPER_ADMIN' ? ShieldCheck : Shield}
  iconColor: string        // ej. 'text-blue-600'
  title: string
  subtitle?: React.ReactNode  // puede ser JSX: <span><MapPin />{ciudad}</span>
  right?: React.ReactNode     // badges, texto, etc. — ChevronRight siempre al final
}

// ChevronRight se renderiza automáticamente al final, NO añadirlo manualmente
<EntityCard
  href={`/admin/torneos/${t.id}`}
  iconBg="bg-blue-50"
  icon={Trophy}
  iconColor="text-blue-600"
  title={t.nombre}
  subtitle={format(new Date(t.fecha), 'dd/MM/yyyy')}
  right={<Badge variant="outline">Activo</Badge>}
/>
```

#### `StatsCard` — `@/components/stats-card`

```tsx
interface StatsCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  loading?: boolean  // muestra Skeleton cuando true
}

<StatsCard
  label="Torneos activos"
  value={kpis.torneos}
  icon={Trophy}
  iconBg="bg-blue-50"
  iconColor="text-blue-600"
  loading={loading}
/>
```

#### `ConfirmDialog` — `@/components/confirm-dialog`

```tsx
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  onConfirm: () => void | Promise<void>
  loading?: boolean
  confirmLabel?: string  // default = 'Eliminar'
}

// El botón confirm siempre es variant="destructive" — no usar para acciones de aprobación
<ConfirmDialog
  open={deleteOpen}
  onOpenChange={setDeleteOpen}
  title="Eliminar torneo"
  description={`¿Seguro que deseas eliminar "${torneo.nombre}"? Esta acción no se puede deshacer.`}
  onConfirm={handleDelete}
  loading={deleting}
/>
```

> **EXCEPCIÓN**: `admin/pagos/[id]/page.tsx` usa un Dialog personalizado (no `ConfirmDialog`) porque tiene acciones de aprobar Y rechazar con distintas semánticas visuales.

#### `FormPage` — `@/components/form-page`

```tsx
interface FormPageProps {
  title: string
  description?: string
  backHref: string    // href del botón ArrowLeft
  children: React.ReactNode
}

// Renderiza: max-w-lg wrapper + ArrowLeft link + título + children
// Usar para formularios estándar
<FormPage title="Nuevo torneo" description="Completa los datos" backHref="/admin/torneos">
  <Card>
    <CardContent>
      {/* form */}
    </CardContent>
  </Card>
</FormPage>
```

> **EXCEPCIÓN**: `team/teams/new/page.tsx` usa `max-w-2xl` (formulario con FieldArray de jugadores) — construye la cabecera manualmente.

#### `BaseSidebar` — `@/components/sidebar`

```tsx
type AccentColor = 'indigo' | 'emerald'

interface SidebarNavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface BaseSidebarProps {
  navItems: SidebarNavItem[]
  accent: AccentColor         // 'indigo' para admin, 'emerald' para team
  brandIcon: React.ElementType
  brandRole: string
  profileHref: string
  dashboardHref: string       // href exacto del dashboard (match exacto, no startsWith)
  defaultInitials: string
}
```

Para añadir un nuevo rol/portal, crear un archivo thin que use `BaseSidebar`:

```tsx
// components/nuevo-sidebar.tsx
const NAV_ITEMS = [{ label: 'Dashboard', href: '/nuevo', icon: LayoutDashboard }]

export function NuevoSidebar() {
  return <BaseSidebar navItems={NAV_ITEMS} accent="indigo" ... />
}
```

### 4.2 `extractApiError` — `@/lib/utils`

```typescript
// Firma:
function extractApiError(err: unknown, fallback = 'Ha ocurrido un error'): string

// Uso obligatorio en TODOS los catch blocks que muestran toast.error():
try {
  await api.post('/resource', data)
  toast.success('Creado correctamente')
} catch (err) {
  toast.error(extractApiError(err, 'Error al crear'))
}

// NUNCA hacer esto:
catch (err) {
  const msg = isAxiosError(err)
    ? (err.response?.data as { message?: string })?.message ?? 'Error'
    : 'Error'
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
import type { Torneo } from '@/lib/types'

export default function TorneosPage() {
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Torneo[]>('/tournaments')
      .then(r => setTorneos(r.data))
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
      {torneos.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No hay torneos aún"
          description="Crea el primero para empezar"
          action={<Button asChild><Link href="/admin/torneos/new">Nuevo torneo</Link></Button>}
        />
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

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
})
type FormValues = z.infer<typeof schema>

export default function NewEntityPage() {
  const router = useRouter()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '' },
  })

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

| Aspecto         | Convención                                       |
| --------------- | ------------------------------------------------ |
| Lenguaje        | TypeScript (strict mode)                         |
| Package Manager | pnpm v9                                          |
| Node Version    | ≥18                                              |
| Indentación     | 2 espacios                                       |
| Fin de línea    | LF                                               |
| Quotes          | Single quotes para strings, double quotes en JSX |

### 5.2 Naming Conventions

| Tipo       | Convención       | Ejemplo                                       |
| ---------- | ---------------- | --------------------------------------------- |
| Archivos   | kebab-case       | `user-controller.ts`, `tournament.service.ts` |
| Clases     | PascalCase       | `UserController`, `TournamentService`         |
| Métodos    | camelCase        | `createUser`, `getTournamentById`             |
| Variables  | camelCase        | `userName`, `tournamentId`                    |
| Constantes | UPPER_SNAKE_CASE | `MAX_PLAYERS_PER_TEAM`                        |
| Enums      | PascalCase       | `UserRole`, `PaymentMethod`                   |

### 5.3 TypeScript — Reglas Estrictas

- **Nunca usar `any`**. Tipar siempre explícitamente.
- Para columnas JSON de TypeORM que reciben `object`, tipar como `unknown` con type guard interno:

```typescript
// ✅ CORRECTO
validateExcelFormat(format: unknown): boolean {
  if (typeof format !== 'object' || format === null) {
    throw new ConflictException('Formato inválido');
  }
  const record = format as Record<string, unknown>;
  const columns = record['columns'];
  // ...
}
```

### 5.4 Enums del Dominio

```typescript
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TEAM_ADMIN = 'TEAM_ADMIN',
}

enum PaymentMethod {
  BINANCE = 'BINANCE',
  ZINLI = 'ZINLI',
  TRANSFERENCIA = 'TRANSFERENCIA',
  EFECTIVO = 'EFECTIVO',
  OTRO = 'OTRO',
}

enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
```

> **IMPORTANTE**: Comparar siempre usando el enum (`PaymentStatus.PENDING`), nunca contra el string literal (`'pending'`). El linter detecta esto como error `@typescript-eslint/no-unsafe-enum-comparison`.

---

## 6. NestJS — Patrones del Proyecto

### 6.1 Estructura de un Módulo

```
module-name/
├── dto/
│   └── module-name.dto.ts     # Create + Update + Response DTOs en un solo archivo
├── entities/
│   └── module-name.entity.ts
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
    // NO incluir @Request() req si no se usa en este método
    return this.service.findOne(id);
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
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Entidad con ID ${id} no encontrada`);
    return entity;
  }
}
```

### 6.4 Columnas UUID en TypeORM

```typescript
// ❌ INCORRECTO
@Column({ type: 'varchar', length: 36 })
tournamentId: string;

// ✅ CORRECTO
@Column({ type: 'uuid' })
tournamentId: string;
```

---

## 7. Next.js 16 — Patrones Obligatorios

### 7.1 proxy.ts en lugar de middleware.ts

En Next.js 16, el archivo de rutas protegidas se llama `proxy.ts` (no `middleware.ts`). **No pueden coexistir ambos archivos**.

```typescript
// apps/web/proxy.ts
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  // lógica de protección de rutas
}

export const config = {
  matcher: ['/admin/:path*', '/team/:path*', '/login'],
}
```

### 7.2 useSearchParams() requiere Suspense

```typescript
// ❌ INCORRECTO — falla en build de producción
export default function MyPage() {
  const searchParams = useSearchParams()
  // ...
}

// ✅ CORRECTO — separar en componente hijo
function MyPageContent() {
  const searchParams = useSearchParams()
  // ...
}

export default function MyPage() {
  return (
    <Suspense>
      <MyPageContent />
    </Suspense>
  )
}
```

**En este proyecto**: `admin/jornadas/new/page.tsx` usa este patrón. El outer component es solo el wrapper Suspense; el inner component `NewJornadaForm` tiene el `FormPage` y toda la lógica.

### 7.3 Inputs numéricos con react-hook-form + Zod

**Nunca usar `z.coerce.number()`** — rompe los genéricos de `Resolver<TFieldValues>`.

```typescript
// ❌ INCORRECTO
monto: z.coerce.number().positive('...')

// ✅ CORRECTO en schema
monto: z.number().positive('...')

// ✅ CORRECTO en JSX
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
// ❌ TypeScript reporta "Object is possibly undefined"
if (arr.length === 1) doSomething(arr[0].id)

// ✅ CORRECTO
const [first] = arr
if (arr.length === 1 && first) doSomething(first.id)
```

### 7.5 react-hooks/exhaustive-deps

El comentario `eslint-disable-next-line` debe ir **dentro del callback**, inmediatamente antes del array de dependencias:

```typescript
// ✅ CORRECTO
useEffect(() => {
  api.get(`/resource/${id}`).then(r => setState(r.data))
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [id])

// ❌ INCORRECTO — el disable antes de useEffect no funciona
```

---

## 8. Autenticación y Autorización

### 8.1 Flujo JWT

1. Login → `POST /auth/login` → recibe `access_token`
2. El token se almacena en cookie (`auth_token`) y en el contexto de React (`useAuth`)
3. Axios tiene un interceptor que añade `Authorization: Bearer <token>` en cada request
4. El `proxy.ts` lee la cookie para proteger rutas en el servidor

### 8.2 Roles

| Rol         | Rutas Frontend | Acceso Backend                       |
| ----------- | -------------- | ------------------------------------ |
| SUPER_ADMIN | `/admin/*`     | Gestión global de todos los recursos |
| TEAM_ADMIN  | `/team/*`      | Solo sus propios equipos/jugadores   |

### 8.3 useAuth Hook

```typescript
const { user, login, logout } = useAuth()
// user: { id, nombre, email, rol } | null
```

---

## 9. Variables de Entorno

### Backend (`apps/api/.env`)

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

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 10. Comandos de Desarrollo

### Nivel Raíz

```bash
pnpm install          # Instalar dependencias
pnpm dev              # Ambas apps en desarrollo
pnpm build            # Build de producción
pnpm lint             # ESLint con --max-warnings 0
```

### TypeScript Check

```bash
# Web (Next.js)
npx tsc --noEmit -p apps/web/tsconfig.json

# API (NestJS)
npx tsc --noEmit -p apps/api/tsconfig.json
```

> `pnpm check-types` solo aplica a `@repo/ui`. Para web y api usar los comandos anteriores.

### Backend

```bash
cd apps/api
pnpm dev              # Desarrollo con hot-reload
pnpm build            # Compilar a dist/
node dist/src/main.js # Iniciar compilado
pnpm test             # Tests unitarios
```

### Frontend

```bash
cd apps/web
pnpm dev              # Desarrollo (puerto 3000)
pnpm build            # Build de producción
pnpm start            # Iniciar build de producción
```

---

## 11. API Endpoints

### Autenticación

| Método | Endpoint       | Auth | Descripción        |
| ------ | -------------- | ---- | ------------------ |
| POST   | /auth/login    | No   | Inicio de sesión   |
| POST   | /auth/register | No   | Registro           |
| GET    | /auth/profile  | JWT  | Perfil del usuario |

### Usuarios

| Método | Endpoint   | Rol         | Descripción        |
| ------ | ---------- | ----------- | ------------------ |
| POST   | /users     | —           | Crear usuario      |
| GET    | /users     | SUPER_ADMIN | Listar usuarios    |
| GET    | /users/:id | —           | Ver usuario        |
| PATCH  | /users/:id | —           | Actualizar usuario |
| DELETE | /users/:id | SUPER_ADMIN | Eliminar usuario   |

### Equipos

| Método | Endpoint   | Rol         | Descripción       |
| ------ | ---------- | ----------- | ----------------- |
| POST   | /teams     | —           | Crear equipo      |
| GET    | /teams     | —           | Listar equipos    |
| GET    | /teams/my  | TEAM_ADMIN  | Mis equipos       |
| GET    | /teams/:id | —           | Ver equipo        |
| PATCH  | /teams/:id | —           | Actualizar equipo |
| DELETE | /teams/:id | SUPER_ADMIN | Eliminar equipo   |

### Jugadores

| Método | Endpoint              | Rol | Descripción         |
| ------ | --------------------- | --- | ------------------- |
| POST   | /players              | —   | Crear jugador       |
| GET    | /players              | —   | Listar jugadores    |
| GET    | /players/team/:teamId | —   | Jugadores de equipo |
| GET    | /players/search       | —   | Buscar jugador      |
| GET    | /players/:id          | —   | Ver jugador         |
| PATCH  | /players/:id          | —   | Actualizar jugador  |
| DELETE | /players/:id          | —   | Eliminar jugador    |

### Clubes

| Método | Endpoint                    | Rol         | Descripción              |
| ------ | --------------------------- | ----------- | ------------------------ |
| POST   | /clubs                      | SUPER_ADMIN | Crear club               |
| GET    | /clubs                      | SUPER_ADMIN | Listar clubes            |
| GET    | /clubs/with-excel-format    | SUPER_ADMIN | Clubes con formato Excel |
| GET    | /clubs/default-excel-format | SUPER_ADMIN | Formato Excel default    |
| GET    | /clubs/:id                  | SUPER_ADMIN | Ver club                 |
| PATCH  | /clubs/:id                  | SUPER_ADMIN | Actualizar club          |
| DELETE | /clubs/:id                  | SUPER_ADMIN | Eliminar club            |

### Torneos

| Método | Endpoint              | Rol         | Descripción         |
| ------ | --------------------- | ----------- | ------------------- |
| POST   | /tournaments          | SUPER_ADMIN | Crear torneo        |
| GET    | /tournaments          | —           | Listar torneos      |
| GET    | /tournaments/active   | —           | Torneos activos     |
| GET    | /tournaments/upcoming | —           | Próximos torneos    |
| GET    | /tournaments/past     | —           | Torneos finalizados |
| GET    | /tournaments/:id      | —           | Ver torneo          |
| PATCH  | /tournaments/:id      | SUPER_ADMIN | Actualizar torneo   |
| DELETE | /tournaments/:id      | SUPER_ADMIN | Eliminar torneo     |

### Jornadas

| Método | Endpoint             | Rol         | Descripción        |
| ------ | -------------------- | ----------- | ------------------ |
| POST   | /match-days          | SUPER_ADMIN | Crear jornada      |
| GET    | /match-days          | —           | Listar jornadas    |
| GET    | /match-days/upcoming | —           | Próximas jornadas  |
| GET    | /match-days/:id      | —           | Ver jornada        |
| PATCH  | /match-days/:id      | SUPER_ADMIN | Actualizar jornada |
| DELETE | /match-days/:id      | SUPER_ADMIN | Eliminar jornada   |

### Inscripciones (TournamentTeams)

| Método | Endpoint                      | Rol         | Descripción            |
| ------ | ----------------------------- | ----------- | ---------------------- |
| POST   | /tournament-teams             | TEAM_ADMIN  | Inscribir equipo       |
| GET    | /tournament-teams             | SUPER_ADMIN | Listar inscripciones   |
| GET    | /tournament-teams/balance/:id | SUPER_ADMIN | Balance inscripción    |
| GET    | /tournament-teams/:id         | —           | Ver inscripción        |
| PATCH  | /tournament-teams/:id         | SUPER_ADMIN | Actualizar inscripción |
| DELETE | /tournament-teams/:id         | SUPER_ADMIN | Eliminar inscripción   |

### Asistencia (PlayerMatchDays)

| Método | Endpoint                             | Rol         | Descripción             |
| ------ | ------------------------------------ | ----------- | ----------------------- |
| POST   | /player-match-days                   | TEAM_ADMIN  | Registrar asistencia    |
| POST   | /player-match-days/bulk              | TEAM_ADMIN  | Asistencia masiva       |
| GET    | /player-match-days                   | SUPER_ADMIN | Listar asistencia       |
| GET    | /player-match-days/team/:matchDayId  | TEAM_ADMIN  | Asistencia por equipo   |
| GET    | /player-match-days/stats/:matchDayId | SUPER_ADMIN | Estadísticas asistencia |
| GET    | /player-match-days/:id               | —           | Ver asistencia          |
| PATCH  | /player-match-days/:id               | TEAM_ADMIN  | Actualizar asistencia   |
| DELETE | /player-match-days/:id               | SUPER_ADMIN | Eliminar asistencia     |

### Invitados (GuestPeople)

| Método | Endpoint                              | Rol         | Descripción          |
| ------ | ------------------------------------- | ----------- | -------------------- |
| POST   | /guest-people                         | —           | Crear invitado       |
| GET    | /guest-people                         | SUPER_ADMIN | Listar invitados     |
| GET    | /guest-people/by-documento/:documento | —           | Buscar por documento |
| GET    | /guest-people/:id                     | —           | Ver invitado         |
| PATCH  | /guest-people/:id                     | TEAM_ADMIN  | Actualizar invitado  |
| DELETE | /guest-people/:id                     | TEAM_ADMIN  | Eliminar invitado    |

### Pagos

| Método | Endpoint              | Rol         | Descripción      |
| ------ | --------------------- | ----------- | ---------------- |
| POST   | /payments             | TEAM_ADMIN  | Registrar pago   |
| GET    | /payments             | SUPER_ADMIN | Listar pagos     |
| GET    | /payments/pending     | SUPER_ADMIN | Pagos pendientes |
| GET    | /payments/rejected    | SUPER_ADMIN | Pagos rechazados |
| GET    | /payments/approved    | SUPER_ADMIN | Pagos aprobados  |
| GET    | /payments/:id         | —           | Ver pago         |
| POST   | /payments/:id/approve | SUPER_ADMIN | Aprobar pago     |
| POST   | /payments/:id/reject  | SUPER_ADMIN | Rechazar pago    |
| PATCH  | /payments/:id         | SUPER_ADMIN | Actualizar pago  |
| DELETE | /payments/:id         | SUPER_ADMIN | Eliminar pago    |

---

## 12. Seeder Automático

`apps/api/src/seed/seed.service.ts` implementa `OnApplicationBootstrap`. Al arrancar:

- Si `NODE_ENV === 'production'` → no hace nada
- Si la tabla `users` tiene registros → no hace nada
- Si la base de datos está vacía → crea datos de prueba completos

Datos creados: 3 usuarios, 2 clubes, 2 torneos, 2 equipos, 17 jugadores, 3 jornadas, 2 inscripciones, 3 pagos.

---

## 13. Errores Comunes

### "password authentication failed"
Verificar credenciales en `apps/api/.env` y que PostgreSQL permita autenticación por contraseña.

### "Column does not support length property"
Usar `type: 'uuid'` en lugar de `type: 'varchar'` para columnas UUID.

### "Port already in use"
```bash
# Windows
taskkill /F /IM node.exe
netstat -ano | findstr :3001
```

### "Cannot find module dist/src/main"
Ejecutar `pnpm build` dentro de `apps/api` antes de iniciar.

### "useSearchParams() should be wrapped in suspense"
Envolver el componente que usa `useSearchParams()` en `<Suspense>` (ver §7.2).

### "Both middleware file and proxy file are detected"
Eliminar `middleware.ts`. En Next.js 16 solo debe existir `proxy.ts`.

### Tipos incorrectos con `z.coerce.number()` y react-hook-form
Usar `z.number()` + `e.target.valueAsNumber` (ver §7.3).

### `@typescript-eslint/no-unsafe-enum-comparison`
Comparar siempre contra el valor del enum (`PaymentStatus.PENDING`), nunca contra el string literal (`'pending'`).

---

## 14. Git Workflow

### Conventional Commits

- `feat:` Nueva funcionalidad
- `fix:` Bug fix
- `docs:` Documentación
- `refactor:` Refactorización sin cambio de comportamiento
- `test:` Tests
- `chore:` Tareas menores (deps, config)

### Flujo

1. Crear rama desde `main`
2. Hacer cambios
3. Verificar calidad: `pnpm lint && npx tsc --noEmit -p apps/web/tsconfig.json && npx tsc --noEmit -p apps/api/tsconfig.json`
4. Commit y push
5. Crear PR hacia `main`
