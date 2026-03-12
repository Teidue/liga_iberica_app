'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { ListSkeleton } from '@/components/list-skeleton'
import { EmptyState } from '@/components/empty-state'
import { EntityCard } from '@/components/entity-card'
import api from '@/lib/api'
import { toast } from 'sonner'
import type { MatchDay } from '@/lib/types'

export default function JornadasPage() {
  const [matchDays, setMatchDays] = useState<MatchDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<MatchDay[]>('/match-days')
      .then(r => setMatchDays(r.data))
      .catch(() => toast.error('Error al cargar jornadas'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jornadas"
        description="Gestiona las jornadas de todos los torneos"
        action={
          <Button asChild>
            <Link href="/admin/jornadas/new">
              Nueva jornada
              <Plus className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {loading ? (
        <ListSkeleton count={4} />
      ) : matchDays.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No hay jornadas aún"
          action={
            <Button asChild>
              <Link href="/admin/jornadas/new">
                Crear jornada
                <Plus className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {matchDays.map(md => {
            const upcoming = new Date(md.fecha) > new Date()
            const mdWithRel = md as MatchDay & { tournament?: { nombre: string }; club?: { nombre: string } }
            return (
              <EntityCard
                key={md.id}
                href={`/admin/jornadas/${md.id}`}
                iconBg="bg-brand-light/15"
                icon={Calendar}
                iconColor="text-brand-light"
                title={new Date(md.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                subtitle={`${mdWithRel.tournament?.nombre ?? '—'} · ${mdWithRel.club?.nombre ?? '—'}`}
                right={<Badge variant={upcoming ? 'outline' : 'secondary'}>{upcoming ? 'Próxima' : 'Pasada'}</Badge>}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
