'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
import type { Club } from '@/lib/types'
import { FormPage } from '@/components/form-page'

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  direccion: z.string().optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

export default function EditClubPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', direccion: '' },
  })
  const { isSubmitting } = form.formState

  useEffect(() => {
    api.get<Club>(`/clubs/${id}`)
      .then(r => form.reset({ nombre: r.data.nombre, direccion: r.data.direccion ?? '' }))
      .catch(() => { toast.error('Sede no encontrada'); router.push('/admin/clubes') })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function onSubmit(values: FormValues) {
    try {
      await api.patch(`/clubs/${id}`, { nombre: values.nombre, direccion: values.direccion || undefined })
      toast.success('Sede actualizada')
      router.push(`/admin/clubes/${id}`)
    } catch (err) {
      toast.error(extractApiError(err, 'Error al actualizar'))
    }
  }

  return (
    <FormPage
      title="Editar Sede"
      description="Modifica los datos de la sede"
      backHref={`/admin/clubes/${id}`}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la sede</CardTitle>
          <CardDescription>Nombre y dirección</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input placeholder="Ej: Pabellón Municipal" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="direccion" render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección (opcional)</FormLabel>
                  <FormControl><Input placeholder="Ej: Calle Mayor 12, Madrid" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-3 pt-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href={`/admin/clubes/${id}`}>Cancelar</Link>
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
    </FormPage>
  )
}
