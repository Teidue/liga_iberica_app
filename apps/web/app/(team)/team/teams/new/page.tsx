'use client'

import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'

const MIN_PLAYERS = 8

const playerSchema = z.object({
  nombre: z.string().min(7, 'Mínimo 7 caracteres').max(30, 'Máximo 30 caracteres'),
  documento: z.string().regex(/^[A-Za-z]\d{7,8}$/, 'Letra + 7 u 8 dígitos (ej: V1234567)'),
})

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  players: z.array(playerSchema).min(MIN_PLAYERS, `Se requieren al menos ${MIN_PLAYERS} jugadores`),
})

type FormValues = z.infer<typeof schema>

const emptyPlayer = () => ({ nombre: '', documento: '' })

export default function NewTeamPage() {
  const router = useRouter()
  const { user } = useAuth()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      players: Array.from({ length: MIN_PLAYERS }, emptyPlayer),
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'players' })
  const { isSubmitting } = form.formState
  const playerCount = fields.length

  async function onSubmit(values: FormValues) {
    try {
      await api.post('/teams', {
        nombre: values.nombre,
        adminId: user?.id,
        players: values.players,
      })
      toast.success('Equipo creado correctamente')
      router.push('/team/teams')
    } catch (err) {
      toast.error(extractApiError(err, 'Error al crear el equipo'))
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/team/teams"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo Equipo</h1>
          <p className="text-sm text-slate-500">Crea un equipo con al menos {MIN_PLAYERS} jugadores</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Nombre del equipo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del equipo</CardTitle>
              <CardDescription>Elige un nombre único para tu equipo</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Jugadores */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Jugadores</CardTitle>
                <CardDescription>Mínimo {MIN_PLAYERS} jugadores requeridos</CardDescription>
              </div>
              <Badge variant={playerCount >= MIN_PLAYERS ? 'default' : 'destructive'}>
                <Users className="mr-1 h-3 w-3" />
                {playerCount} / {MIN_PLAYERS} mín.
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <span className="mt-2.5 w-5 shrink-0 text-right text-xs font-medium text-slate-400">
                    {index + 1}
                  </span>
                  <div className="grid flex-1 grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name={`players.${index}.nombre`}
                      render={({ field: f }) => (
                        <FormItem>
                          {index === 0 && <FormLabel className="text-xs">Nombre completo</FormLabel>}
                          <FormControl>
                            <Input placeholder="Ej: Juan Pérez García" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`players.${index}.documento`}
                      render={({ field: f }) => (
                        <FormItem>
                          {index === 0 && <FormLabel className="text-xs">Documento</FormLabel>}
                          <FormControl>
                            <Input placeholder="Ej: V1234567" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-1 shrink-0 text-slate-400 hover:text-red-500"
                    disabled={playerCount <= MIN_PLAYERS}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => append(emptyPlayer())}
              >
                Añadir jugador
                <Plus className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/team/teams">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear equipo
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
