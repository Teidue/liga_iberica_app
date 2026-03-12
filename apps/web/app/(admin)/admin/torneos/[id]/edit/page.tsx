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
import type { Tournament } from '@/lib/types'
import { FormPage } from '@/components/form-page'

const schema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  montoInscripcion: z.number().positive('Debe ser mayor que 0'),
  fechaInicio: z.string().min(1, 'Requerido'),
  fechaFin: z.string().min(1, 'Requerido'),
}).refine(d => d.fechaFin >= d.fechaInicio, {
  message: 'La fecha de fin debe ser posterior al inicio',
  path: ['fechaFin'],
})

type FormValues = z.infer<typeof schema>

export default function EditTorneoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', montoInscripcion: 0, fechaInicio: '', fechaFin: '' },
  })
  const { isSubmitting } = form.formState

  useEffect(() => {
    api.get<Tournament>(`/tournaments/${id}`)
      .then(r => form.reset({
        nombre: r.data.nombre,
        montoInscripcion: Number(r.data.montoInscripcion),
        fechaInicio: r.data.fechaInicio.split('T')[0],
        fechaFin: r.data.fechaFin.split('T')[0],
      }))
      .catch(() => { toast.error('Torneo no encontrado'); router.push('/admin/torneos') })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function onSubmit(values: FormValues) {
    try {
      await api.patch(`/tournaments/${id}`, values)
      toast.success('Torneo actualizado')
      router.push(`/admin/torneos/${id}`)
    } catch (err) {
      toast.error(extractApiError(err, 'Error al actualizar'))
    }
  }

  return (
    <FormPage
      title="Editar Torneo"
      description="Modifica los datos del torneo"
      backHref={`/admin/torneos/${id}`}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del torneo</CardTitle>
          <CardDescription>Nombre, monto de inscripción y período de fechas</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input placeholder="Ej: Torneo Apertura 2025" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="montoInscripcion" render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto de inscripción por equipo ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      name={field.name}
                      ref={field.ref}
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={e => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="fechaInicio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de inicio</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fechaFin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de fin</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href={`/admin/torneos/${id}`}>Cancelar</Link>
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
