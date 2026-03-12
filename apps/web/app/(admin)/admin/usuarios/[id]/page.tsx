'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Shield, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import type { User, Team } from '@/lib/types'

export default function UsuarioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user: currentUser } = useAuth()

  const [user, setUser] = useState<User | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const userRes = await api.get<User>(`/users/${id}`)
        setUser(userRes.data)
        if (userRes.data.rol === 'TEAM_ADMIN') {
          const teamsRes = await api.get<Team[]>('/teams').catch(() => ({ data: [] as Team[] }))
          setTeams(teamsRes.data.filter(t => t.adminId === id))
        }
      } catch {
        toast.error('Usuario no encontrado')
        router.push('/admin/usuarios')
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
      await api.delete(`/users/${id}`)
      toast.success('Usuario eliminado')
      router.push('/admin/usuarios')
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
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!user) return null

  const isSelf = currentUser?.id === id
  const isAdmin = user.rol === 'SUPER_ADMIN'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/usuarios"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{user.nombre}</h1>
              <Badge variant={isAdmin ? 'default' : 'secondary'}>
                {isAdmin ? 'Super Admin' : 'Team Admin'}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/usuarios/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          {!isSelf && (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            {isAdmin
              ? <ShieldCheck className="h-4 w-4 text-brand-darkest" />
              : <Shield className="h-4 w-4 text-brand" />
            }
            Información del usuario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Nombre</p>
              <p className="font-medium text-slate-900">{user.nombre}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="font-medium text-slate-900">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Rol</p>
              <p className="font-medium text-slate-900">{isAdmin ? 'Super Admin' : 'Team Admin'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Miembro desde</p>
              <p className="font-medium text-slate-900">{new Date(user.created_at).toLocaleDateString('es-ES')}</p>
            </div>
          </div>
          {isSelf && (
            <p className="rounded-lg bg-brand/10 px-3 py-2 text-xs text-brand">
              Esta es tu cuenta activa. No puedes eliminarte a ti mismo.
            </p>
          )}
        </CardContent>
      </Card>

      {user.rol === 'TEAM_ADMIN' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Equipos gestionados ({teams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">Sin equipos asignados</p>
            ) : (
              <div className="divide-y">
                {teams.map(t => (
                  <Link key={t.id} href={`/admin/equipos/${t.id}`} className="flex items-center justify-between py-3 hover:bg-slate-50 rounded px-1">
                    <p className="font-medium text-slate-900">{t.nombre}</p>
                    <Badge variant="secondary">Ver equipo</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Eliminar usuario?"
        description={<>Se eliminará permanentemente la cuenta de <strong>{user.nombre}</strong>. Sus equipos quedarán sin administrador.</>}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
