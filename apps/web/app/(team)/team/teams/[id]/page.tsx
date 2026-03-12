'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, UserX, UserCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
import type { Team, Player } from '@/lib/types'

interface TeamDetail extends Team {
  playersCount?: number
}

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null)
  const [reactivatingPlayerId, setReactivatingPlayerId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Player | null>(null)

  async function loadData() {
    try {
      const [teamRes, playersRes] = await Promise.all([
        api.get<TeamDetail>(`/teams/${id}`),
        api.get<Player[]>(`/players/team/${id}`),
      ])
      setTeam(teamRes.data)
      setPlayers(playersRes.data)
    } catch {
      toast.error('Error al cargar el equipo')
      router.push('/team/teams')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData() }, [id])

  async function handleDeactivatePlayer() {
    if (!confirmDelete) return
    setDeletingPlayerId(confirmDelete.id)
    try {
      await api.delete(`/players/${confirmDelete.id}`)
      toast.success(`${confirmDelete.nombre} marcado como inactivo`)
      setConfirmDelete(null)
      await loadData()
    } catch (err) {
      toast.error(extractApiError(err, 'Error'))
    } finally {
      setDeletingPlayerId(null)
    }
  }

  async function handleReactivatePlayer(player: Player) {
    setReactivatingPlayerId(player.id)
    try {
      await api.patch(`/players/${player.id}`, { estado: true })
      toast.success(`${player.nombre} reactivado`)
      await loadData()
    } catch (err) {
      toast.error(extractApiError(err, 'Error al reactivar'))
    } finally {
      setReactivatingPlayerId(null)
    }
  }

  const activePlayers = players.filter((p) => p.estado)
  const inactivePlayers = players.filter((p) => !p.estado)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!team) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/team/teams"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{team.nombre}</h1>
            <p className="text-sm text-slate-500">{activePlayers.length} jugadores activos</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/team/teams/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar equipo
          </Link>
        </Button>
      </div>

      {/* Players */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Jugadores activos</CardTitle>
          <Button size="sm" asChild>
            <Link href={`/team/teams/${id}/players/new`}>
              Agregar
              <Plus className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {activePlayers.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">Sin jugadores activos</p>
              <Button variant="link" asChild className="mt-2">
                <Link href={`/team/teams/${id}/players/new`}>Agregar el primero</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {activePlayers.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900">{p.nombre}</p>
                    <p className="text-xs text-slate-500">Doc: {p.documento}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/team/teams/${id}/players/${p.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => setConfirmDelete(p)}
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive players */}
      {inactivePlayers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-500">
              Jugadores inactivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {inactivePlayers.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 opacity-70">
                  <div>
                    <p className="font-medium text-slate-700">{p.nombre}</p>
                    <p className="text-xs text-slate-500">Doc: {p.documento}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-700"
                    disabled={reactivatingPlayerId === p.id}
                    onClick={() => handleReactivatePlayer(p)}
                  >
                    {reactivatingPlayerId === p.id
                      ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      : <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                    }
                    Reactivar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm deactivate dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Desactivar jugador?</DialogTitle>
            <DialogDescription>
              <strong>{confirmDelete?.nombre}</strong> será marcado como inactivo.
              Podrás reactivarlo más adelante si es necesario.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivatePlayer}
              disabled={!!deletingPlayerId}
            >
              {deletingPlayerId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
