'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
})

type FormValues = z.infer<typeof schema>

export default function EditTeamPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '' },
  })

  const { isSubmitting, isLoading } = form.formState

  useEffect(() => {
    api.get<{ nombre: string }>(`/teams/${id}`)
      .then((r) => form.reset({ nombre: r.data.nombre }))
      .catch(() => { toast.error('Error al cargar equipo'); router.push('/team/teams') })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function onSubmit(values: FormValues) {
    try {
      await api.patch(`/teams/${id}`, { nombre: values.nombre })
      toast.success('Equipo actualizado')
      router.push(`/team/teams/${id}`)
    } catch (err) {
      toast.error(extractApiError(err, 'Error al actualizar'))
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/team/teams/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Equipo</h1>
          <p className="text-sm text-slate-500">Actualiza el nombre del equipo</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del equipo</CardTitle>
          <CardDescription>Modifica los datos del equipo</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del equipo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Los Tigres FC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" asChild className="flex-1">
                    <Link href={`/team/teams/${id}`}>Cancelar</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
