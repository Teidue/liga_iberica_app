'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
import { FormPage } from '@/components/form-page'

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  rol: z.enum(['SUPER_ADMIN', 'TEAM_ADMIN']),
})

type FormValues = z.infer<typeof schema>

export default function NewUsuarioPage() {
  const router = useRouter()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', email: '', password: '', rol: 'TEAM_ADMIN' },
  })
  const { isSubmitting } = form.formState

  async function onSubmit(values: FormValues) {
    try {
      await api.post('/users', values)
      toast.success('Usuario creado')
      router.push('/admin/usuarios')
    } catch (err) {
      toast.error(extractApiError(err, 'Error al crear'))
    }
  }

  return (
    <FormPage
      title="Nuevo Usuario"
      description="Crea un acceso al sistema"
      backHref="/admin/usuarios"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del usuario</CardTitle>
          <CardDescription>El usuario podrá iniciar sesión con estos datos</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl><Input placeholder="Ej: Carlos Rodríguez" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="carlos@liga.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl><Input type="password" placeholder="Mínimo 6 caracteres" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="rol" render={({ field }) => (
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
                  <Link href="/admin/usuarios">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear usuario
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </FormPage>
  )
}
