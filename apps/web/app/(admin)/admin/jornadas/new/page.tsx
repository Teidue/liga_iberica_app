'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import type { Tournament, Club } from '@/lib/types'
import { FormPage } from '@/components/form-page'

const schema = z.object({
  fecha: z.string().min(1, 'Requerido'),
  tournamentId: z.string().min(1, 'Selecciona un torneo'),
  clubId: z.string().min(1, 'Selecciona una sede'),
})

type FormValues = z.infer<typeof schema>

function NewJornadaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTournamentId = searchParams.get('tournamentId') ?? ''

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [clubs, setClubs] = useState<Club[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fecha: '', tournamentId: defaultTournamentId, clubId: '' },
  })
  const { isSubmitting } = form.formState

  useEffect(() => {
    Promise.all([
      api.get<Tournament[]>('/tournaments'),
      api.get<Club[]>('/clubs'),
    ]).then(([tRes, cRes]) => {
      setTournaments(tRes.data)
      setClubs(cRes.data)
    }).catch(() => toast.error('Error al cargar datos'))
  }, [])

  async function onSubmit(values: FormValues) {
    try {
      await api.post('/match-days', values)
      toast.success('Jornada creada')
      const back = defaultTournamentId ? `/admin/torneos/${defaultTournamentId}` : '/admin/jornadas'
      router.push(back)
    } catch (err) {
      toast.error(extractApiError(err, 'Error al crear'))
    }
  }

  const backHref = defaultTournamentId ? `/admin/torneos/${defaultTournamentId}` : '/admin/jornadas'

  return (
    <FormPage
      title="Nueva Jornada"
      description="Programa una jornada en un torneo"
      backHref={backHref}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la jornada</CardTitle>
          <CardDescription>Fecha, torneo y sede</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="fecha" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="tournamentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Torneo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecciona un torneo" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tournaments.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="clubId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sede</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecciona una sede" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clubs.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-3 pt-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href={backHref}>Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear jornada
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </FormPage>
  )
}

export default function NewJornadaPage() {
  return (
    <Suspense>
      <NewJornadaForm />
    </Suspense>
  )
}
