'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, User, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import type { User as UserType } from '@/lib/types'

const profileSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
})

const passwordSchema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirm: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine(d => d.password === d.confirm, { message: 'Las contraseñas no coinciden', path: ['confirm'] })

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

export default function AdminPerfilPage() {
  const { login } = useAuth()
  const [profile, setProfile] = useState<UserType | null>(null)

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nombre: '', email: '' },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirm: '' },
  })

  useEffect(() => {
    api.get<UserType>('/users/profile')
      .then(r => {
        setProfile(r.data)
        profileForm.reset({ nombre: r.data.nombre, email: r.data.email })
      })
      .catch(() => toast.error('Error al cargar el perfil'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onProfileSubmit(values: ProfileValues) {
    if (!profile) return
    try {
      const res = await api.patch<UserType>(`/users/${profile.id}`, values)
      setProfile(res.data)
      // Update auth context with new name/email
      const token = localStorage.getItem('auth_token') ?? ''
      login(token, { id: res.data.id, nombre: res.data.nombre, email: res.data.email, rol: res.data.rol })
      toast.success('Perfil actualizado')
    } catch (err) {
      toast.error(extractApiError(err, 'Error al actualizar'))
    }
  }

  async function onPasswordSubmit(values: PasswordValues) {
    if (!profile) return
    try {
      await api.patch(`/users/${profile.id}`, { password: values.password })
      passwordForm.reset()
      toast.success('Contraseña actualizada')
    } catch (err) {
      toast.error(extractApiError(err, 'Error al cambiar contraseña'))
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
        <p className="text-sm text-slate-500">Gestiona tu información personal y contraseña</p>
      </div>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Información personal
          </CardTitle>
          <CardDescription>Actualiza tu nombre y correo electrónico</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <FormField control={profileForm.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={profileForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="pt-1">
                <p className="mb-3 text-xs text-slate-500">Rol: <span className="font-medium text-slate-700">Super Admin</span></p>
                <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                  {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar cambios
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator />

      {/* Password change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            Cambiar contraseña
          </CardTitle>
          <CardDescription>Elige una contraseña de al menos 6 caracteres</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField control={passwordForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="confirm" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" variant="outline" disabled={passwordForm.formState.isSubmitting}>
                {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cambiar contraseña
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
