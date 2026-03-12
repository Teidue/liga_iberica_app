'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Trophy, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import type { Team, Player, TournamentTeam } from '@/lib/types'

type TeamDetail = Team & {
  playersCount?: number
  admin?: { nombre: string; email: string }
}

export default function EquipoAdminDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [inscriptions, setInscriptions] = useState<TournamentTeam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [teamRes, playersRes, insRes] = await Promise.all([
          api.get<TeamDetail>(`/teams/${id}`),
          api.get<Player[]>(`/players/team/${id}`),
          api.get<TournamentTeam[]>(`/tournament-teams?teamId=${id}`),
        ])
        setTeam(teamRes.data)
        setPlayers(playersRes.data)
        setInscriptions(insRes.data)
      } catch {
        toast.error('Error al cargar el equipo')
        router.push('/admin/equipos')
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!team) return null

  const activePlayers = players.filter(p => p.estado)
  const inactivePlayers = players.filter(p => !p.estado)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/equipos"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{team.nombre}</h1>
            <p className="text-sm text-slate-500">Admin: {team.admin?.nombre ?? '—'} · {team.admin?.email ?? ''}</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/equipos/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Jugadores activos</p><p className="mt-1 text-2xl font-bold text-slate-900">{activePlayers.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Inactivos</p><p className="mt-1 text-2xl font-bold text-slate-900">{inactivePlayers.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Torneos</p><p className="mt-1 text-2xl font-bold text-slate-900">{inscriptions.length}</p></CardContent></Card>
      </div>

      {/* Torneos inscritos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Trophy className="h-4 w-4" />
            Torneos inscritos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inscriptions.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">Sin inscripciones</p>
          ) : (
            <div className="divide-y">
              {inscriptions.map(ins => {
                const insWithRel = ins as TournamentTeam & { tournament?: { nombre: string }; balance?: number; totalPaid?: number }
                const balance = insWithRel.balance ?? 0
                return (
                  <div key={ins.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-900">{insWithRel.tournament?.nombre ?? '—'}</p>
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

      {/* Jugadores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-4 w-4" />
            Jugadores activos ({activePlayers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activePlayers.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">Sin jugadores activos</p>
          ) : (
            <div className="divide-y">
              {activePlayers.map(p => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900">{p.nombre}</p>
                    <p className="text-xs text-slate-500">Doc: {p.documento}</p>
                  </div>
                  <Badge variant="secondary">Activo</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
