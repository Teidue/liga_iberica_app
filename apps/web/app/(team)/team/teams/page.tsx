'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { ListSkeleton } from '@/components/list-skeleton'
import { EmptyState } from '@/components/empty-state'
import { EntityCard } from '@/components/entity-card'
import api from '@/lib/api'
import type { Team } from '@/lib/types'

interface TeamWithCount extends Team {
  playersCount?: number
}

export default function MyTeamsPage() {
  const [teams, setTeams] = useState<TeamWithCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data: baseTeams } = await api.get<TeamWithCount[]>('/teams/my')
        // GET /teams/my no incluye playersCount — lo obtenemos del detalle en paralelo
        const detailed = await Promise.all(
          baseTeams.map((t) =>
            api.get<TeamWithCount>(`/teams/${t.id}`).then((r) => r.data).catch(() => t)
          )
        )
        setTeams(detailed)
      } catch {
        toast.error('Error al cargar equipos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Equipos"
        description="Gestiona tus equipos y jugadores"
        action={
          <Button asChild>
            <Link href="/team/teams/new">
              Nuevo equipo
              <Plus className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {loading ? (
        <ListSkeleton count={3} />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tienes equipos aún"
          description="Crea tu primer equipo para empezar"
          action={
            <Button asChild>
              <Link href="/team/teams/new">
                Crear equipo
                <Plus className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <EntityCard
              key={team.id}
              href={`/team/teams/${team.id}`}
              iconBg="bg-brand-muted/20"
              icon={Users}
              iconColor="text-brand"
              title={team.nombre}
              subtitle={`${team.playersCount ?? 0} jugadores activos`}
              right={<Badge variant="secondary">Activo</Badge>}
            />
          ))}
        </div>
      )}
    </div>
  )
}
