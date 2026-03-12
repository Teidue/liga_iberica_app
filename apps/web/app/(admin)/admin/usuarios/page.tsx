'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, UserCircle, ShieldCheck, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { ListSkeleton } from '@/components/list-skeleton'
import { EmptyState } from '@/components/empty-state'
import { EntityCard } from '@/components/entity-card'
import api from '@/lib/api'
import { toast } from 'sonner'
import type { User } from '@/lib/types'

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<User[]>('/users')
      .then(r => setUsers(r.data))
      .catch(() => toast.error('Error al cargar usuarios'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestiona los accesos al sistema"
        action={
          <Button asChild>
            <Link href="/admin/usuarios/new">
              Nuevo usuario
              <Plus className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {loading ? (
        <ListSkeleton count={3} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="No hay usuarios"
        />
      ) : (
        <div className="space-y-4">
          {users.map(u => (
            <EntityCard
              key={u.id}
              href={`/admin/usuarios/${u.id}`}
              iconBg={u.rol === 'SUPER_ADMIN' ? 'bg-brand-darkest/15' : 'bg-brand/10'}
              icon={u.rol === 'SUPER_ADMIN' ? ShieldCheck : Shield}
              iconColor={u.rol === 'SUPER_ADMIN' ? 'text-brand-darkest' : 'text-brand'}
              title={u.nombre}
              subtitle={u.email}
              right={
                <Badge variant={u.rol === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                  {u.rol === 'SUPER_ADMIN' ? 'Super Admin' : 'Team Admin'}
                </Badge>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
