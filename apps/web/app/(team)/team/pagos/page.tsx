'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, CreditCard, ChevronRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { ListSkeleton } from '@/components/list-skeleton'
import { EmptyState } from '@/components/empty-state'
import api from '@/lib/api'
import type { TournamentTeam } from '@/lib/types'

type TournamentTeamWithRel = TournamentTeam & {
  tournament?: { nombre: string }
  team?: { nombre: string }
  totalPaid?: number
  totalPending?: number
  balance?: number
  paymentsCount?: number
}

export default function PagosTeamPage() {
  const [inscriptions, setInscriptions] = useState<TournamentTeamWithRel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<{ id: string }[]>('/teams/my')
      .then(async teamsRes => {
        const allIns: TournamentTeamWithRel[] = []
        for (const team of teamsRes.data) {
          const insRes = await api.get<TournamentTeamWithRel[]>(`/tournament-teams?teamId=${team.id}`)
          allIns.push(...insRes.data)
        }
        setInscriptions(allIns)
      })
      .catch(() => toast.error('Error al cargar pagos'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagos"
        description="Gestiona los pagos de inscripción de tus equipos"
        action={
          <Button asChild>
            <Link href="/team/pagos/new">
              Registrar pago
              <Plus className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {loading ? (
        <ListSkeleton count={3} />
      ) : inscriptions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sin inscripciones"
          description="Cuando te inscribas en un torneo podrás gestionar los pagos aquí"
        />
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Inscripciones asociadas ({inscriptions.length})
          </h2>
          <div className="space-y-4">
            {inscriptions.map(ins => {
              const balance = ins.balance ?? (ins.montoInscripcion - (ins.totalPaid ?? 0))
              const totalPending = ins.totalPending ?? 0
              const alDia = balance <= 0
              return (
                <Link key={ins.id} href={`/team/pagos/${ins.id}`} className="block">
                  <Card className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{ins.tournament?.nombre ?? '—'}</p>
                          <p className="text-sm text-slate-500">{ins.team?.nombre ?? '—'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={alDia ? 'default' : 'destructive'}>
                            {alDia ? 'Al día' : `Debe $${balance}`}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Inscripción: <span className="font-medium text-slate-700">${ins.montoInscripcion}</span></span>
                        <span>Aprobado: <span className="font-medium text-emerald-700">${ins.totalPaid ?? 0}</span></span>
                        {totalPending > 0 && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Clock className="h-3 w-3" />
                            Pendiente aprobación: <span className="font-medium">${totalPending}</span>
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
