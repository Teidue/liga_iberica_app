'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import { isAxiosError } from '@/lib/utils'
import type { Team, User } from '@/lib/types'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  adminId: z.string().min(1, 'Selecciona un administrador'),
})

type FormValues = z.infer<typeof schema>

export default function EditEquipoAdminPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [teamAdmins, setTeamAdmins] = useState<User[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', adminId: '' },
  })
  const { isSubmitting } = form.formState

  useEffect(() => {
    async function load() {
      try {
        const [teamRes, usersRes] = await Promise.all([
          api.get<Team & { admin?: { id: string } }>(`/teams/${id}`),
          api.get<User[]>('/users'),
        ])
        const admins = usersRes.data.filter(u => u.rol === 'TEAM_ADMIN')
        setTeamAdmins(admins)
        form.reset({
          nombre: teamRes.data.nombre,
          adminId: teamRes.data.adminId ?? teamRes.data.admin?.id ?? '',
        })
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

  async function onSubmit(values: FormValues) {
    try {
      await api.patch(`/teams/${id}`, { nombre: values.nombre, adminId: values.adminId })
      toast.success('Equipo actualizado')
      router.push(`/admin/equipos/${id}`)
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message ?? 'Error al actualizar'
        : 'Error al actualizar'
      toast.error(msg)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/equipos/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar equipo</h1>
          <p className="text-sm text-slate-500">Modifica los datos del equipo</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del equipo</CardTitle>
          <CardDescription>Actualiza el nombre o reasigna el administrador</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del equipo</FormLabel>
                  <FormControl><Input placeholder="Nombre del equipo" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="adminId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Administrador del equipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un administrador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teamAdmins.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nombre} · {u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-3 pt-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href={`/admin/equipos/${id}`}>Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar cambios
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
