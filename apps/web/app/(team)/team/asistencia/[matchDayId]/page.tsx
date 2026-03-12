'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, Lock, Loader2, Save, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
import type { GuestPerson, MatchDay, Player, PlayerMatchDay, Team, TournamentTeam } from '@/lib/types'

type GuestDraft = { nombre: string; documento: string }

type PlayerRow = Player & {
  pmdId?: string
  va: boolean
  guestId?: string | null
  guestInfo?: { id: string; nombre: string; documento: string } | null
  pendingGuest?: GuestDraft
  showGuestForm?: boolean
}

type MatchDayWithRel = MatchDay & {
  tournament?: { id: string; nombre: string }
  club?: { nombre: string; direccion: string | null }
}

export default function AsistenciaMatchDayPage() {
  const { matchDayId } = useParams<{ matchDayId: string }>()
  const router = useRouter()

  const [matchDay, setMatchDay] = useState<MatchDayWithRel | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [rows, setRows] = useState<PlayerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const mdRes = await api.get<MatchDayWithRel>(`/match-days/${matchDayId}`)
        const md = mdRes.data
        setMatchDay(md)

        const tournamentId = md.tournamentId
        if (!tournamentId) throw new Error('Jornada sin torneo asociado')

        const teamsRes = await api.get<Team[]>('/teams/my')
        let inscribedTeam: Team | null = null

        for (const t of teamsRes.data) {
          const insRes = await api
            .get<TournamentTeam[]>(`/tournament-teams?teamId=${t.id}`)
            .catch(() => ({ data: [] as TournamentTeam[] }))
          const match = insRes.data.find(ins => ins.tournamentId === tournamentId)
          if (match) { inscribedTeam = t; break }
        }

        if (!inscribedTeam) {
          toast.error('Tu equipo no está inscrito en este torneo')
          router.push('/team/asistencia')
          return
        }

        setTeam(inscribedTeam)

        const [playersRes, pmdRes] = await Promise.all([
          api.get<Player[]>(`/players/team/${inscribedTeam.id}?active=true`),
          api.get<PlayerMatchDay[]>(`/player-match-days/team/${matchDayId}`),
        ])

        const existing = pmdRes.data
        setRows(
          playersRes.data.map(p => {
            const pmd = existing.find(e => e.playerId === p.id)
            return {
              ...p,
              pmdId: pmd?.id,
              va: pmd?.va ?? false,
              guestId: pmd?.guestId ?? null,
              guestInfo: pmd?.guest
                ? { id: pmd.guest.id, nombre: pmd.guest.nombre, documento: pmd.guest.documento }
                : null,
              showGuestForm: false,
            }
          }),
        )
      } catch {
        toast.error('Error al cargar datos')
        router.push('/team/asistencia')
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchDayId])

  function togglePlayer(playerId: string) {
    setRows(prev => prev.map(r => {
      if (r.id !== playerId) return r
      // When toggling off, clear any guest data
      const nowAttending = !r.va
      return {
        ...r,
        va: nowAttending,
        ...(nowAttending ? {} : {
          guestId: null,
          guestInfo: null,
          pendingGuest: undefined,
          showGuestForm: false,
        }),
      }
    }))
  }

  function toggleGuestForm(playerId: string) {
    setRows(prev => prev.map(r =>
      r.id === playerId
        ? { ...r, showGuestForm: !r.showGuestForm, pendingGuest: r.showGuestForm ? undefined : { nombre: '', documento: '' } }
        : r
    ))
  }

  function updatePendingGuest(playerId: string, field: 'nombre' | 'documento', value: string) {
    setRows(prev => prev.map(r =>
      r.id === playerId
        ? { ...r, pendingGuest: { ...r.pendingGuest!, [field]: value } }
        : r
    ))
  }

  function removeGuest(playerId: string) {
    setRows(prev => prev.map(r =>
      r.id === playerId
        ? { ...r, guestId: null, guestInfo: null, pendingGuest: undefined, showGuestForm: false }
        : r
    ))
  }

  async function handleSave() {
    setSaving(true)
    try {
      for (const row of rows) {
        let guestId: string | null | undefined = row.guestId

        // Resolve pending guest (create if new)
        if (row.pendingGuest && row.va && row.pendingGuest.nombre && row.pendingGuest.documento) {
          const existing = await api
            .get<GuestPerson>(`/guest-people/by-documento/${row.pendingGuest.documento}`)
            .catch(() => null)
          if (existing?.data) {
            guestId = existing.data.id
          } else {
            const created = await api.post<GuestPerson>('/guest-people', row.pendingGuest)
            guestId = created.data.id
          }
        }

        // Guest was removed
        if (!row.guestId && !row.pendingGuest && row.pmdId) {
          guestId = null
        }

        const pmdPayload = { va: row.va, guestId: row.va ? guestId : null }

        if (row.pmdId) {
          await api.patch(`/player-match-days/${row.pmdId}`, pmdPayload)
        } else if (row.va) {
          await api.post('/player-match-days', {
            playerId: row.id,
            matchDayId,
            ...pmdPayload,
          })
        }
      }

      toast.success('Asistencia guardada')
      router.push('/team/asistencia')
    } catch (err) {
      toast.error(extractApiError(err, 'Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!matchDay) return null

  const isCerrado = matchDay.cerrado
  const attendingCount = rows.filter(r => r.va).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
          <Link href="/team/asistencia"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {new Date(matchDay.fecha).toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </h1>
            {isCerrado && (
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

      {/* Team badge */}
      {team && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-slate-500">Equipo:</p>
          <Badge variant="secondary">{team.nombre}</Badge>
        </div>
      )}

      {/* Cerrado notice */}
      {isCerrado && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <Lock className="h-4 w-4 shrink-0" />
          <p>El administrador ha cerrado el registro de asistencia para esta jornada. Ya no se pueden realizar cambios.</p>
        </div>
      )}

      {/* Player list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">
            Jugadores · <span className="text-emerald-600">{attendingCount} asisten</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          {rows.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">No hay jugadores activos en este equipo</p>
            </div>
          ) : (
            rows.map(row => (
              <div key={row.id} className="py-3">
                {/* Player row */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{row.nombre}</p>
                    <p className="text-xs text-slate-500">Doc: {row.documento}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={row.va ? 'default' : 'secondary'}>
                      {row.va ? 'Asiste' : 'No asiste'}
                    </Badge>
                    <Switch
                      checked={row.va}
                      onCheckedChange={() => togglePlayer(row.id)}
                      disabled={isCerrado}
                    />
                  </div>
                </div>

                {/* Guest section — only shown when player attends */}
                {row.va && !isCerrado && (
                  <div className="mt-2 ml-1">
                    {/* Existing guest */}
                    {row.guestInfo && !row.showGuestForm ? (
                      <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm">
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-xs">Invitado</Badge>
                        <span className="font-medium text-slate-800">{row.guestInfo.nombre}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500 text-xs">Doc: {row.guestInfo.documento}</span>
                        <button
                          type="button"
                          onClick={() => removeGuest(row.id)}
                          className="ml-auto text-slate-400 hover:text-red-500"
                          aria-label="Quitar invitado"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : !row.guestInfo && !row.showGuestForm ? (
                      /* Add guest button */
                      <button
                        type="button"
                        onClick={() => toggleGuestForm(row.id)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand transition-colors"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Añadir invitado
                      </button>
                    ) : null}

                    {/* Inline guest form */}
                    {row.showGuestForm && (
                      <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-slate-600">Datos del invitado</p>
                          <button
                            type="button"
                            onClick={() => toggleGuestForm(row.id)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Nombre</label>
                            <Input
                              placeholder="Nombre completo"
                              value={row.pendingGuest?.nombre ?? ''}
                              onChange={e => updatePendingGuest(row.id, 'nombre', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Documento</label>
                            <Input
                              placeholder="Ej: V1234567"
                              value={row.pendingGuest?.documento ?? ''}
                              onChange={e => updatePendingGuest(row.id, 'documento', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">
                          Si el documento ya existe en el sistema se reutilizará el invitado.
                        </p>
                      </div>
                    )}

                    {/* Pending guest preview (form collapsed but data entered) */}
                    {!row.showGuestForm && row.pendingGuest?.nombre && (
                      <div className="flex items-center gap-2 rounded-md bg-brand/10 border border-brand/30 px-3 py-2 text-sm">
                        <Badge variant="outline" className="border-brand/40 text-brand text-xs">Invitado pendiente</Badge>
                        <span className="font-medium text-slate-800">{row.pendingGuest.nombre}</span>
                        <button
                          type="button"
                          onClick={() => toggleGuestForm(row.id)}
                          className="ml-auto text-slate-400 hover:text-brand"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Read-only guest for cerrado state */}
                {row.va && isCerrado && row.guestInfo && (
                  <div className="mt-2 ml-1 flex items-center gap-2 rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm">
                    <Badge variant="outline" className="text-xs">Invitado</Badge>
                    <span className="font-medium text-slate-800">{row.guestInfo.nombre}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 text-xs">Doc: {row.guestInfo.documento}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      {rows.length > 0 && !isCerrado && (
        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving
            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            : <Save className="mr-2 h-4 w-4" />
          }
          Guardar asistencia
        </Button>
      )}
    </div>
  )
}
