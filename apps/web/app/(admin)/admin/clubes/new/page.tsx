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
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  direccion: z.string().min(5, 'Mínimo 5 caracteres').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

export default function NewClubPage() {
  const router = useRouter()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', direccion: '' },
  })
  const { isSubmitting } = form.formState

  async function onSubmit(values: FormValues) {
    try {
      await api.post('/clubs', { nombre: values.nombre, direccion: values.direccion || undefined })
      toast.success('Sede creada')
      router.push('/admin/clubes')
    } catch (err) {
      toast.error(extractApiError(err, 'Error al crear'))
    }
  }

  return (
    <FormPage
      title="Nueva Sede"
      description="Registra un nuevo pabellón o club"
      backHref="/admin/clubes"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la sede</CardTitle>
          <CardDescription>El formato Excel se puede configurar después</CardDescription>
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
                  <Link href="/admin/clubes">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear sede
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </FormPage>
  )
}
