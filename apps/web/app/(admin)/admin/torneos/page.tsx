'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { ListSkeleton } from '@/components/list-skeleton'
import { EmptyState } from '@/components/empty-state'
import { EntityCard } from '@/components/entity-card'
import api from '@/lib/api'
import { toast } from 'sonner'
import type { Tournament } from '@/lib/types'

function getTournamentStatus(t: Tournament) {
  const now = new Date()
  const start = new Date(t.fechaInicio)
  const end = new Date(t.fechaFin)
  if (now > end) return { label: 'Finalizado', variant: 'secondary' as const }
  if (now < start) return { label: 'Próximo', variant: 'outline' as const }
  return { label: 'Activo', variant: 'default' as const }
}

export default function TorneosPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Tournament[]>('/tournaments')
      .then(r => setTournaments(r.data))
      .catch(() => toast.error('Error al cargar torneos'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Torneos"
        description="Gestiona los torneos de la liga"
        action={
          <Button asChild>
            <Link href="/admin/torneos/new">
              Nuevo torneo
              <Plus className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {loading ? (
        <ListSkeleton count={3} />
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No hay torneos aún"
          action={
            <Button asChild>
              <Link href="/admin/torneos/new">
                Crear torneo
                <Plus className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {tournaments.map(t => {
            const status = getTournamentStatus(t)
            return (
              <EntityCard
                key={t.id}
                href={`/admin/torneos/${t.id}`}
                iconBg="bg-brand/10"
                icon={Trophy}
                iconColor="text-brand"
                title={t.nombre}
                subtitle={`${new Date(t.fechaInicio).toLocaleDateString('es-ES')} — ${new Date(t.fechaFin).toLocaleDateString('es-ES')}`}
                right={<Badge variant={status.variant}>{status.label}</Badge>}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
