'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Calendar, Users, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
import type { Tournament, MatchDay, TournamentTeam } from '@/lib/types'

function getStatus(t: Tournament) {
  const now = new Date()
  const start = new Date(t.fechaInicio)
  const end = new Date(t.fechaFin)
  if (now > end) return { label: 'Finalizado', variant: 'secondary' as const }
  if (now < start) return { label: 'Próximo', variant: 'outline' as const }
  return { label: 'Activo', variant: 'default' as const }
}

export default function TorneoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matchDays, setMatchDays] = useState<MatchDay[]>([])
  const [inscriptions, setInscriptions] = useState<TournamentTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [tRes, mdRes, insRes] = await Promise.all([
          api.get<Tournament>(`/tournaments/${id}`),
          api.get<MatchDay[]>(`/match-days?tournamentId=${id}`),
          api.get<TournamentTeam[]>(`/tournament-teams?tournamentId=${id}`),
        ])
        setTournament(tRes.data)
        setMatchDays(mdRes.data)
        setInscriptions(insRes.data)
      } catch {
        toast.error('Error al cargar el torneo')
        router.push('/admin/torneos')
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/tournaments/${id}`)
      toast.success('Torneo eliminado')
      router.push('/admin/torneos')
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

  if (!tournament) return null

  const status = getStatus(tournament)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/torneos"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{tournament.nombre}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-sm text-slate-500">
              {new Date(tournament.fechaInicio).toLocaleDateString('es-ES')} — {new Date(tournament.fechaFin).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/torneos/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setConfirmDelete(true)} aria-label="Eliminar torneo">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Inscripciones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-4 w-4" />
            Equipos inscritos ({inscriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inscriptions.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">Sin equipos inscritos aún</p>
          ) : (
            <div className="divide-y">
              {inscriptions.map(ins => {
                const ins2 = ins as TournamentTeam & { team?: { nombre: string }; totalPaid?: number; balance?: number }
                const balance = ins2.balance ?? (ins2.montoInscripcion - (ins2.totalPaid ?? 0))
                return (
                  <div key={ins.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-900">{ins2.team?.nombre ?? '—'}</p>
                      <p className="text-xs text-slate-500">Inscripción: €{ins.montoInscripcion}</p>
                    </div>
                    <Badge variant={balance <= 0 ? 'default' : 'destructive'}>
                      {balance <= 0 ? 'Al día' : `Debe €${balance}`}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jornadas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Calendar className="h-4 w-4" />
            Jornadas ({matchDays.length})
          </CardTitle>
          <Button size="sm" asChild>
            <Link href={`/admin/jornadas/new?tournamentId=${id}`}>
              Nueva jornada
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {matchDays.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">Sin jornadas programadas</p>
          ) : (
            <div className="divide-y">
              {matchDays.map(md => (
                <Link key={md.id} href={`/admin/jornadas/${md.id}`} className="flex items-center justify-between py-3 hover:bg-slate-50 rounded px-1">
                  <div>
                    <p className="font-medium text-slate-900">
                      {new Date(md.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-500">{(md as MatchDay & { club?: { nombre: string } }).club?.nombre ?? '—'}</p>
                  </div>
                  <Badge variant={new Date(md.fecha) > new Date() ? 'outline' : 'secondary'}>
                    {new Date(md.fecha) > new Date() ? 'Próxima' : 'Pasada'}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar torneo?"
        description={<>Esta acción eliminará <strong>{tournament.nombre}</strong> permanentemente. No se puede eliminar si tiene jornadas o inscripciones asociadas.</>}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
