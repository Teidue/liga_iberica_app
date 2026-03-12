'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormPage } from '@/components/form-page'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
import type { User } from '@/lib/types'

const infoSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  rol: z.enum(['SUPER_ADMIN', 'TEAM_ADMIN']),
})

const passwordSchema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirm: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine(d => d.password === d.confirm, { message: 'Las contraseñas no coinciden', path: ['confirm'] })

type InfoValues = z.infer<typeof infoSchema>
type PasswordValues = z.infer<typeof passwordSchema>

export default function EditUsuarioPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const infoForm = useForm<InfoValues>({
    resolver: zodResolver(infoSchema),
    defaultValues: { nombre: '', email: '', rol: 'TEAM_ADMIN' },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirm: '' },
  })

  const { isLoading } = infoForm.formState

  useEffect(() => {
    api.get<User>(`/users/${id}`)
      .then(r => infoForm.reset({ nombre: r.data.nombre, email: r.data.email, rol: r.data.rol }))
      .catch(() => { toast.error('Usuario no encontrado'); router.push('/admin/usuarios') })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function onInfoSubmit(values: InfoValues) {
    try {
      await api.patch(`/users/${id}`, values)
      toast.success('Usuario actualizado')
      router.push(`/admin/usuarios/${id}`)
    } catch (err) {
      toast.error(extractApiError(err, 'Error al actualizar'))
    }
  }

  async function onPasswordSubmit(values: PasswordValues) {
    try {
      await api.patch(`/users/${id}`, { password: values.password })
      passwordForm.reset()
      toast.success('Contraseña actualizada')
    } catch (err) {
      toast.error(extractApiError(err, 'Error al cambiar contraseña'))
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  return (
    <FormPage title="Editar usuario" description="Modifica los datos del usuario" backHref={`/admin/usuarios/${id}`}>

      {/* Info form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del usuario</CardTitle>
          <CardDescription>Nombre, email y rol del usuario</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...infoForm}>
            <form onSubmit={infoForm.handleSubmit(onInfoSubmit)} className="space-y-4">
              <FormField control={infoForm.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={infoForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={infoForm.control} name="rol" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TEAM_ADMIN">Team Admin — Gestor de equipo</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin — Administrador global</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-3 pt-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href={`/admin/usuarios/${id}`}>Cancelar</Link>
                </Button>
                <Button type="submit" disabled={infoForm.formState.isSubmitting} className="flex-1">
                  {infoForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar cambios
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator />

      {/* Password reset */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restablecer contraseña</CardTitle>
          <CardDescription>Establece una nueva contraseña para este usuario</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField control={passwordForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <FormControl><Input type="password" placeholder="Mínimo 6 caracteres" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="confirm" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <FormControl><Input type="password" placeholder="Repite la contraseña" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" variant="outline" disabled={passwordForm.formState.isSubmitting}>
                {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Restablecer contraseña
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </FormPage>
  )
}
