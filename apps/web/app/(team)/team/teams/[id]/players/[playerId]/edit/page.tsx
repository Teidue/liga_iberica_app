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
import { Skeleton } from '@/components/ui/skeleton'
import { FormPage } from '@/components/form-page'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
import type { Player } from '@/lib/types'

const schema = z.object({
  nombre: z.string().min(7, 'Mínimo 7 caracteres').max(30, 'Máximo 30 caracteres'),
  documento: z.string().regex(/^[A-Za-z]\d{7,8}$/, 'Letra + 7 u 8 dígitos (ej: V1234567)'),
})

type FormValues = z.infer<typeof schema>

export default function EditPlayerPage() {
  const { id: teamId, playerId } = useParams<{ id: string; playerId: string }>()
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', documento: '' },
  })

  const { isSubmitting, isLoading } = form.formState

  useEffect(() => {
    api.get<Player>(`/players/${playerId}`)
      .then((r) => form.reset({ nombre: r.data.nombre, documento: r.data.documento }))
      .catch(() => { toast.error('Jugador no encontrado'); router.push(`/team/teams/${teamId}`) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId])

  async function onSubmit(values: FormValues) {
    try {
      await api.patch(`/players/${playerId}`, values)
      toast.success('Jugador actualizado')
      router.push(`/team/teams/${teamId}`)
    } catch (err) {
      toast.error(extractApiError(err, 'Error al actualizar'))
    }
  }

  return (
    <FormPage
      title="Editar Jugador"
      description="Actualiza los datos del jugador"
      backHref={`/team/teams/${teamId}`}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del jugador</CardTitle>
          <CardDescription>Modifica el nombre o documento de identidad</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
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
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </FormPage>
  )
}
