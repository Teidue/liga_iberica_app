'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { ListSkeleton } from '@/components/list-skeleton'
import { EmptyState } from '@/components/empty-state'
import api from '@/lib/api'
import type { Tournament, TournamentTeam, Team } from '@/lib/types'

type TournamentWithStatus = Tournament & { inscribed: boolean; tournamentTeamId?: string }

export default function TorneosTeamPage() {
  const [tournaments, setTournaments] = useState<TournamentWithStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [activeRes, upcomingRes, teamsRes] = await Promise.all([
          api.get<Tournament[]>('/tournaments/active'),
          api.get<Tournament[]>('/tournaments/upcoming'),
          api.get<Team[]>('/teams/my'),
        ])

        const allTournaments = [
          ...activeRes.data,
          ...upcomingRes.data.filter(u => !activeRes.data.find(a => a.id === u.id)),
        ]

        // Fetch inscriptions for all user teams
        const inscriptions: TournamentTeam[] = []
        for (const team of teamsRes.data) {
          const insRes = await api.get<TournamentTeam[]>(`/tournament-teams?teamId=${team.id}`).catch(() => ({ data: [] as TournamentTeam[] }))
          inscriptions.push(...insRes.data)
        }

        const inscribedTournamentIds = new Set(inscriptions.map(i => i.tournamentId))

        setTournaments(allTournaments.map(t => ({
          ...t,
          inscribed: inscribedTournamentIds.has(t.id),
          tournamentTeamId: inscriptions.find(i => i.tournamentId === t.id)?.id,
        })))
      } catch {
        toast.error('Error al cargar torneos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const available = tournaments.filter(t => !t.inscribed)
  const inscribed = tournaments.filter(t => t.inscribed)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Torneos"
        description="Inscribe tus equipos en torneos activos y próximos"
      />

      {loading ? (
        <ListSkeleton count={3} />
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No hay torneos disponibles"
          description="El administrador publicará los próximos torneos"
        />
      ) : (
        <>
          {available.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Disponibles para inscribirse</h2>
              {available.map(t => (
                <Card key={t.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10">
                        <Trophy className="h-5 w-5 text-brand" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{t.nombre}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(t.fechaInicio).toLocaleDateString('es-ES')} — {new Date(t.fechaFin).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {new Date(t.fechaInicio) > new Date() ? 'Próximo' : 'Activo'}
                      </Badge>
                      <Button size="sm" asChild>
                        <Link href={`/team/torneos/${t.id}/inscribir`}>
                          Inscribirse
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {inscribed.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ya inscritos</h2>
              {inscribed.map(t => (
                <Card key={t.id} className="bg-slate-50">
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{t.nombre}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(t.fechaInicio).toLocaleDateString('es-ES')} — {new Date(t.fechaFin).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-emerald-600">Inscrito</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
