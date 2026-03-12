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
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
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

export default function NewTorneoPage() {
  const router = useRouter()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', montoInscripcion: 0, fechaInicio: '', fechaFin: '' },
  })
  const { isSubmitting } = form.formState

  async function onSubmit(values: FormValues) {
    try {
      await api.post('/tournaments', values)
      toast.success('Torneo creado')
      router.push('/admin/torneos')
    } catch (err) {
      toast.error(extractApiError(err, 'Error al crear'))
    }
  }

  return (
    <FormPage
      title="Nuevo Torneo"
      description="Crea un nuevo torneo de la liga"
      backHref="/admin/torneos"
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
                  <Link href="/admin/torneos">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear torneo
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </FormPage>
  )
}
