'use client'

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
import { FormPage } from '@/components/form-page'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'

const schema = z.object({
  nombre: z.string().min(7, 'Mínimo 7 caracteres').max(30, 'Máximo 30 caracteres'),
  documento: z.string().regex(/^[A-Za-z]\d{7,8}$/, 'Letra + 7 u 8 dígitos (ej: V1234567)'),
})

type FormValues = z.infer<typeof schema>

export default function NewPlayerPage() {
  const { id: teamId } = useParams<{ id: string }>()
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', documento: '' },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: FormValues) {
    try {
      await api.post('/players', { ...values, teamId })
      toast.success('Jugador agregado correctamente')
      router.push(`/team/teams/${teamId}`)
    } catch (err) {
      toast.error(extractApiError(err, 'Error al agregar jugador'))
    }
  }

  return (
    <FormPage
      title="Agregar Jugador"
      description="Añade un nuevo jugador al equipo"
      backHref={`/team/teams/${teamId}`}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del jugador</CardTitle>
          <CardDescription>El documento debe ser único dentro del equipo</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Carlos Rodríguez Gil" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento de identidad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: V1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-3 pt-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href={`/team/teams/${teamId}`}>Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Agregar jugador
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </FormPage>
  )
}
