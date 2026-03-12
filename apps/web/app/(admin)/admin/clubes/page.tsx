'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Building2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { ListSkeleton } from '@/components/list-skeleton'
import { EmptyState } from '@/components/empty-state'
import { EntityCard } from '@/components/entity-card'
import api from '@/lib/api'
import { toast } from 'sonner'
import type { Club } from '@/lib/types'

export default function ClubesPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Club[]>('/clubs')
      .then(r => setClubs(r.data))
      .catch(() => toast.error('Error al cargar sedes'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sedes"
        description="Pabellones y clubes donde se juegan las jornadas"
        action={
          <Button asChild>
            <Link href="/admin/clubes/new">
              Nueva sede
              <Plus className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {loading ? (
        <ListSkeleton count={3} />
      ) : clubs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No hay sedes registradas"
          action={
            <Button asChild>
              <Link href="/admin/clubes/new">
                Crear sede
                <Plus className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {clubs.map(c => (
            <EntityCard
              key={c.id}
              href={`/admin/clubes/${c.id}`}
              iconBg="bg-brand-dark/15"
              icon={Building2}
              iconColor="text-brand-dark"
              title={c.nombre}
              subtitle={
                c.direccion
                  ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.direccion}</span>
                  : undefined
              }
              right={
                <Badge variant={c.formatoExcel ? 'default' : 'outline'}>
                  {c.formatoExcel ? 'Excel configurado' : 'Sin formato Excel'}
                </Badge>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
