'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import {
  ArrowLeft, Pencil, Trash2, Loader2, Users, Lock, LockOpen, Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
import type { MatchDay, PlayerMatchDay, Team } from '@/lib/types'

type AttendanceRecord = PlayerMatchDay & {
  player: { id: string; nombre: string; documento: string; teamId: string }
}

export default function JornadaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [matchDay, setMatchDay] = useState<MatchDay | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [teams, setTeams] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [mdRes, attRes] = await Promise.all([
          api.get<MatchDay>(`/match-days/${id}`),
          api.get<AttendanceRecord[]>(`/player-match-days?matchDayId=${id}`)
            .catch(() => ({ data: [] as AttendanceRecord[] })),
        ])
        setMatchDay(mdRes.data)

        const records = attRes.data.filter(r => r.player)
        setAttendance(records)

        // Load team names for unique teamIds found in attendance
        const teamIds = [...new Set(records.map(r => r.player.teamId).filter(Boolean))]
        if (teamIds.length > 0) {
          const teamResults = await Promise.all(
            teamIds.map(tid =>
              api.get<Team>(`/teams/${tid}`).then(r => [tid, r.data.nombre] as [string, string]).catch(() => null)
            )
          )
          setTeams(new Map(teamResults.filter((t): t is [string, string] => t !== null)))
        }
      } catch {
        toast.error('Error al cargar la jornada')
        router.push('/admin/jornadas')
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const grouped = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>()
    for (const rec of attendance) {
      const tid = rec.player.teamId
      if (!map.has(tid)) map.set(tid, [])
      map.get(tid)!.push(rec)
    }
    return map
  }, [attendance])

  async function toggleCerrado() {
    if (!matchDay) return
    setToggling(true)
    try {
      await api.patch(`/match-days/${id}`, { cerrado: !matchDay.cerrado })
      setMatchDay(prev => prev ? { ...prev, cerrado: !prev.cerrado } : null)
      toast.success(matchDay.cerrado ? 'Asistencia reabierta' : 'Asistencia cerrada correctamente')
    } catch {
      toast.error('Error al cambiar el estado de la jornada')
    } finally {
      setToggling(false)
    }
  }

  async function downloadExcel() {
    if (!matchDay) return

    // Fetch fresh attendance data so guests saved after page load are included
    const attRes = await api.get<AttendanceRecord[]>(`/player-match-days?matchDayId=${id}`)
      .catch(() => ({ data: [] as AttendanceRecord[] }))
    const freshRecords = attRes.data.filter(r => r.player)

    // Refresh team name map for any new teams
    const freshTeamIds = [...new Set(freshRecords.map(r => r.player.teamId).filter(Boolean))]
    const freshTeams = new Map(teams)
    const missing = freshTeamIds.filter(tid => !freshTeams.has(tid))
    if (missing.length > 0) {
      const teamResults = await Promise.all(
        missing.map(tid =>
          api.get<Team>(`/teams/${tid}`).then(r => [tid, r.data.nombre] as [string, string]).catch(() => null)
        )
      )
      teamResults.filter((t): t is [string, string] => t !== null).forEach(([tid, nombre]) => freshTeams.set(tid, nombre))
    }

    // Re-group fresh records by teamId
    const freshGrouped = new Map<string, AttendanceRecord[]>()
    for (const rec of freshRecords) {
      const tid = rec.player.teamId
      if (!freshGrouped.has(tid)) freshGrouped.set(tid, [])
      freshGrouped.get(tid)!.push(rec)
    }

    type ExcelColumn = { name: string; header: string; width?: number }
    const rawColumns = (matchDay.club?.formatoExcel as { columns?: ExcelColumn[] } | null)?.columns
    const columns: ExcelColumn[] = rawColumns?.length
      ? rawColumns
      : [
          { name: 'nombre', header: 'Nombre', width: 40 },
          { name: 'documento', header: 'Documento', width: 25 },
          { name: 'tipo', header: 'Tipo', width: 15 },
          { name: 'nombreInvitante', header: 'Invitante', width: 30 },
        ]

    const headers = columns.map(c => c.header)
    const rows: (string | number)[][] = []

    for (const [teamId, records] of freshGrouped) {
      const teamName = freshTeams.get(teamId) ?? 'Equipo desconocido'
      const attending = records.filter(r => r.va)
      if (attending.length === 0) continue

      rows.push([`EQUIPO: ${teamName}`, ...Array(headers.length - 1).fill('')])
      rows.push(headers)

      for (const rec of attending) {
        const playerRow = columns.map(col => {
          if (col.name === 'nombre') return rec.player.nombre
          if (col.name === 'documento') return rec.player.documento
          if (col.name === 'tipo') return 'Jugador'
          if (col.name === 'nombreInvitante') return ''
          return ''
        })
        rows.push(playerRow)

        if (rec.guest) {
          const guestRow = columns.map(col => {
            if (col.name === 'nombre') return rec.guest!.nombre
            if (col.name === 'documento') return rec.guest!.documento
            if (col.name === 'tipo') return 'Invitado'
            if (col.name === 'nombreInvitante') return rec.player.nombre
            return ''
          })
          rows.push(guestRow)
        }
      }
      rows.push([]) // blank separator between teams
    }

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = columns.map(c => ({ wch: c.width ?? 20 }))

    const wb = XLSX.utils.book_new()
    const fecha = new Date(matchDay.fecha).toLocaleDateString('es-ES').replace(/\//g, '-')
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia')
    XLSX.writeFile(wb, `asistencia-${fecha}.xlsx`)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/match-days/${id}`)
      toast.success('Jornada eliminada')
      router.push('/admin/jornadas')
    } catch (err) {
      toast.error(extractApiError(err, 'Error al eliminar'))
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!matchDay) return null

  const upcoming = new Date(matchDay.fecha) > new Date()
  const totalAttending = attendance.filter(a => a.va).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
            <Link href="/admin/jornadas"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {new Date(matchDay.fecha).toLocaleDateString('es-ES', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </h1>
              <Badge variant={upcoming ? 'outline' : 'secondary'}>
                {upcoming ? 'Próxima' : 'Pasada'}
              </Badge>
              {matchDay.cerrado && (
                <Badge variant="destructive" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Cerrada
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {matchDay.tournament?.nombre ?? '—'} · {matchDay.club?.nombre ?? '—'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/jornadas/${id}/edit`}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Editar
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCerrado}
            disabled={toggling}
            className={matchDay.cerrado ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-amber-200 text-amber-700 hover:bg-amber-50'}
          >
            {toggling
              ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              : matchDay.cerrado
                ? <LockOpen className="mr-2 h-3.5 w-3.5" />
                : <Lock className="mr-2 h-3.5 w-3.5" />
            }
            {matchDay.cerrado ? 'Reabrir asistencia' : 'Cerrar asistencia'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadExcel}
            disabled={attendance.filter(a => a.va).length === 0}
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            Descargar Excel
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => setConfirmDelete(true)}
            aria-label="Eliminar jornada"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Torneo</p>
            <p className="mt-1 font-semibold text-slate-900">{matchDay.tournament?.nombre ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Sede</p>
            <p className="mt-1 font-semibold text-slate-900">{matchDay.club?.nombre ?? '—'}</p>
            {matchDay.club?.direccion && (
              <p className="text-xs text-slate-400">{matchDay.club.direccion}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Asistencia confirmada</p>
            <p className="mt-1 font-semibold text-slate-900">{totalAttending} jugadores</p>
          </CardContent>
        </Card>
      </div>

      {/* Cerrado notice */}
      {matchDay.cerrado && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <Lock className="h-4 w-4 shrink-0" />
          <p>La asistencia está cerrada. Los administradores de equipos no pueden modificarla hasta que la reabras.</p>
        </div>
      )}

      {/* Players grouped by team */}
      {attendance.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-4 h-12 w-12 text-slate-300" />
            <p className="font-medium text-slate-700">Sin asistencia registrada</p>
            <p className="mt-1 text-sm text-slate-400">Los equipos aún no han registrado asistencia para esta jornada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([teamId, records]) => {
            const teamName = teams.get(teamId) ?? 'Equipo desconocido'
            const attending = records.filter(r => r.va).length
            return (
              <Card key={teamId}>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Users className="h-4 w-4 text-slate-500" />
                    {teamName}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="default">{attending} asisten</Badge>
                    {records.length - attending > 0 && (
                      <Badge variant="secondary">{records.length - attending} no asisten</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {records.map(rec => (
                      <div key={rec.id} className="py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{rec.player.nombre}</p>
                            <p className="text-xs text-slate-500">Doc: {rec.player.documento}</p>
                          </div>
                          <Badge variant={rec.va ? 'default' : 'secondary'}>
                            {rec.va ? 'Asiste' : 'No asiste'}
                          </Badge>
                        </div>
                        {rec.va && rec.guest && (
                          <div className="mt-2 ml-4 flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm">
                            <Badge variant="outline" className="text-xs">Invitado</Badge>
                            <span className="font-medium text-slate-800">{rec.guest.nombre}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500">Doc: {rec.guest.documento}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar jornada?"
        description={<>Se eliminará la jornada del <strong>{new Date(matchDay.fecha).toLocaleDateString('es-ES')}</strong>. No se puede eliminar si tiene asistencia registrada.</>}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
