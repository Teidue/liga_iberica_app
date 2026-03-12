'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { ListSkeleton } from '@/components/list-skeleton'
import { EmptyState } from '@/components/empty-state'
import { EntityCard } from '@/components/entity-card'
import api from '@/lib/api'
import { toast } from 'sonner'
import type { Team } from '@/lib/types'

type TeamWithCount = Team & { playersCount?: number }

export default function EquiposAdminPage() {
  const [teams, setTeams] = useState<TeamWithCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<TeamWithCount[]>('/teams')
      .then(r => setTeams(r.data))
      .catch(() => toast.error('Error al cargar equipos'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipos"
        description="Vista global de todos los equipos registrados"
      />

      {loading ? (
        <ListSkeleton count={4} />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay equipos registrados"
          description="Los equipos los crean los administradores de equipo"
        />
      ) : (
        <div className="space-y-4">
          {teams.map(t => {
            const tWithRel = t as TeamWithCount & { admin?: { nombre: string; email: string } }
            return (
              <EntityCard
                key={t.id}
                href={`/admin/equipos/${t.id}`}
                iconBg="bg-brand-muted/20"
                icon={Users}
                iconColor="text-brand-dark"
                title={t.nombre}
                subtitle={`Admin: ${tWithRel.admin?.nombre ?? '—'}`}
                right={<p className="text-sm text-slate-500">{t.playersCount ?? 0} jugadores</p>}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
