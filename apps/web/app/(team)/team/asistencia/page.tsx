'use client'

import { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { ListSkeleton } from '@/components/list-skeleton'
import { EmptyState } from '@/components/empty-state'
import { EntityCard } from '@/components/entity-card'
import api from '@/lib/api'
import type { MatchDay, Team, TournamentTeam } from '@/lib/types'

type MatchDayWithStatus = MatchDay & {
  tournament?: { nombre: string }
  club?: { nombre: string }
  hasAttendance: boolean
}

export default function AsistenciaPage() {
  const [matchDays, setMatchDays] = useState<MatchDayWithStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // 1. Equipos del admin y sus torneos inscritos
        const teamsRes = await api.get<Team[]>('/teams/my')
        const allIns: TournamentTeam[] = []
        for (const team of teamsRes.data) {
          const insRes = await api
            .get<TournamentTeam[]>(`/tournament-teams?teamId=${team.id}`)
            .catch(() => ({ data: [] as TournamentTeam[] }))
          allIns.push(...insRes.data)
        }

        const tournamentIds = [...new Set(allIns.map(i => i.tournamentId))]

        if (tournamentIds.length === 0) {
          setMatchDays([])
          return
        }

        // 2. Jornadas filtradas por torneos inscritos (incluye últimos 7 días)
        const idsParam = tournamentIds.join(',')
        const mdRes = await api.get<MatchDayWithStatus[]>(
          `/match-days/upcoming?limit=20&tournamentIds=${idsParam}`,
        )

        // 3. Verificar en paralelo si ya hay asistencia registrada por jornada
        const attendanceChecks = await Promise.all(
          mdRes.data.map(md =>
            api
              .get<{ id: string }[]>(`/player-match-days/team/${md.id}`)
              .then(r => ({ id: md.id, hasAttendance: r.data.length > 0 }))
              .catch(() => ({ id: md.id, hasAttendance: false })),
          ),
        )

        const attendanceMap = Object.fromEntries(
          attendanceChecks.map(({ id, hasAttendance }) => [id, hasAttendance]),
        )

        setMatchDays(
          mdRes.data.map(md => ({ ...md, hasAttendance: attendanceMap[md.id] ?? false })),
        )
      } catch {
        toast.error('Error al cargar jornadas')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asistencia"
        description="Registra la asistencia de tus jugadores por jornada"
      />

      {loading ? (
        <ListSkeleton count={4} />
      ) : matchDays.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No hay jornadas disponibles"
          description="Las jornadas de tus torneos inscritos aparecerán aquí"
        />
      ) : (
        <div className="space-y-4">
          {matchDays.map(md => (
            <EntityCard
              key={md.id}
              href={`/team/asistencia/${md.id}`}
              iconBg={md.hasAttendance ? 'bg-emerald-50' : 'bg-brand-muted/20'}
              icon={md.hasAttendance ? CheckCircle2 : Clock}
              iconColor={md.hasAttendance ? 'text-emerald-600' : 'text-brand-muted'}
              title={new Date(md.fecha).toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
              subtitle={`${md.tournament?.nombre ?? '—'} · ${md.club?.nombre ?? '—'}`}
              right={
                md.hasAttendance
                  ? <Badge variant="default" className="bg-emerald-600">Registrada</Badge>
                  : <Badge variant="outline">Pendiente</Badge>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
