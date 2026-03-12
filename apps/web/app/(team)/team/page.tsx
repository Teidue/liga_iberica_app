'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, Calendar, Clock, Plus,
  ChevronRight, CheckCircle2, UserCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import type { Team, TournamentTeam, MatchDay } from '@/lib/types'

type TeamWithCount = Team & { playersCount?: number }
type MatchDayWithStatus = MatchDay & {
  tournament?: { nombre: string }
  club?: { nombre: string }
  hasAttendance: boolean
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

export default function TeamDashboard() {
  const { user } = useAuth()
  const firstName = user?.nombre?.split(' ')[0] ?? 'Admin'

  const [teams, setTeams] = useState<TeamWithCount[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [matchDays, setMatchDays] = useState<MatchDayWithStatus[]>([])
  const [jornLoading, setJornLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // ── Fase 1: equipos (se muestra en cuanto llega) ──────────
      let teamsData: TeamWithCount[] = []
      try {
        const r = await api.get<TeamWithCount[]>('/teams/my')
        teamsData = r.data
        setTeams(teamsData)
      } catch {
        toast.error('Error al cargar equipos')
      } finally {
        setTeamsLoading(false)
      }

      // ── Fase 2: jornadas filtradas por torneos inscritos ──────
      try {
        const allIns: TournamentTeam[] = []
        for (const team of teamsData) {
          const r = await api
            .get<TournamentTeam[]>(`/tournament-teams?teamId=${team.id}`)
            .catch(() => ({ data: [] as TournamentTeam[] }))
          allIns.push(...r.data)
        }

        const tournamentIds = [...new Set(allIns.map(i => i.tournamentId))]
        if (tournamentIds.length === 0) return

        const mdRes = await api.get<MatchDayWithStatus[]>(
          `/match-days/upcoming?limit=3&tournamentIds=${tournamentIds.join(',')}`,
        )

        const checks = await Promise.all(
          mdRes.data.map(md =>
            api
              .get<{ id: string }[]>(`/player-match-days/team/${md.id}`)
              .then(r => ({ id: md.id, hasAttendance: r.data.length > 0 }))
              .catch(() => ({ id: md.id, hasAttendance: false })),
          ),
        )

        const attMap = Object.fromEntries(checks.map(c => [c.id, c.hasAttendance]))
        setMatchDays(mdRes.data.map(md => ({ ...md, hasAttendance: attMap[md.id] ?? false })))
      } finally {
        setJornLoading(false)
      }
    }

    load()
  }, [])

  const totalPlayers    = teams.reduce((sum, t) => sum + (t.playersCount ?? 0), 0)
  const pendingJornadas = matchDays.filter(md => !md.hasAttendance).length
  const nextMatchDay    = matchDays[0]

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-8">

      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hola, {firstName}</h1>
        <p className="text-sm capitalize text-slate-500">{today}</p>
      </div>

      {/* ── KPI cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted/20">
              <Users className="h-5 w-5 text-brand" />
            </div>
            <div>
              {teamsLoading
                ? <Skeleton className="mb-1 h-6 w-8" />
                : <p className="text-xl font-bold text-slate-900">{teams.length}</p>}
              <p className="text-xs text-slate-500">Mis equipos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
              <UserCheck className="h-5 w-5 text-brand" />
            </div>
            <div>
              {teamsLoading
                ? <Skeleton className="mb-1 h-6 w-8" />
                : <p className="text-xl font-bold text-slate-900">{totalPlayers}</p>}
              <p className="text-xs text-slate-500">Jugadores activos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light/15">
              <Calendar className="h-5 w-5 text-brand-light" />
            </div>
            <div className="min-w-0">
              {jornLoading
                ? <Skeleton className="mb-1 h-5 w-20" />
                : nextMatchDay
                  ? <p className="truncate text-sm font-bold text-slate-900">{fmtDate(nextMatchDay.fecha)}</p>
                  : <p className="text-sm font-bold text-slate-400">Sin jornadas</p>}
              <p className="text-xs text-slate-500">Próxima jornada</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              jornLoading || pendingJornadas === 0 ? 'bg-emerald-50' : 'bg-amber-50'
            }`}>
              <Clock className={`h-5 w-5 ${
                jornLoading || pendingJornadas === 0 ? 'text-emerald-600' : 'text-amber-600'
              }`} />
            </div>
            <div>
              {jornLoading
                ? <Skeleton className="mb-1 h-6 w-8" />
                : <p className="text-xl font-bold text-slate-900">{pendingJornadas}</p>}
              <p className="text-xs text-slate-500">Sin asistencia</p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── Contenido principal (2 columnas en desktop) ───────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Próximas jornadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Próximas jornadas</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/team/asistencia">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {jornLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[60px] w-full rounded-lg" />)}
              </div>
            ) : matchDays.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-400">Sin jornadas próximas</p>
                <Button variant="link" size="sm" asChild className="mt-1">
                  <Link href="/team/torneos">Inscribirse en un torneo</Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {matchDays.map(md => (
                  <li key={md.id}>
                    <Link
                      href={`/team/asistencia/${md.id}`}
                      className="flex items-center justify-between rounded-lg border px-3 py-3 text-sm transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          md.hasAttendance ? 'bg-emerald-50' : 'bg-amber-50'
                        }`}>
                          {md.hasAttendance
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            : <Clock className="h-4 w-4 text-amber-500" />}
                        </div>
                        <div>
                          <p className="font-medium capitalize text-slate-800">
                            {fmtDate(md.fecha)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {md.tournament?.nombre ?? '—'} · {md.club?.nombre ?? '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {md.hasAttendance
                          ? <Badge className="bg-emerald-600 text-xs">Lista</Badge>
                          : <Badge variant="outline" className="border-amber-300 text-xs text-amber-600">Pendiente</Badge>}
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Mis equipos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Mis equipos</CardTitle>
            <Button size="sm" asChild>
              <Link href="/team/teams/new">
                Nuevo
                <Plus className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {teamsLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-[60px] w-full rounded-lg" />)}
              </div>
            ) : teams.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-400">No tienes equipos aún</p>
                <Button variant="link" size="sm" asChild className="mt-1">
                  <Link href="/team/teams/new">Crear el primero</Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {teams.map(t => (
                  <li key={t.id}>
                    <Link
                      href={`/team/teams/${t.id}`}
                      className="flex items-center justify-between rounded-lg border px-3 py-3 text-sm transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-muted/20">
                          <Users className="h-4 w-4 text-brand" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{t.nombre}</p>
                          <p className="text-xs text-slate-500">
                            {t.playersCount != null
                              ? `${t.playersCount} jugadores activos`
                              : '—'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
