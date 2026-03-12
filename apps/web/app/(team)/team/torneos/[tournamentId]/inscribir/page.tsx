'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
import type { Tournament, Team } from '@/lib/types'

const schema = z.object({
  teamId: z.string().min(1, 'Selecciona un equipo'),
})

type FormValues = z.infer<typeof schema>

export default function InscribirTorneoPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const router = useRouter()

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { teamId: '' },
  })
  const { isSubmitting } = form.formState

  useEffect(() => {
    Promise.all([
      api.get<Tournament>(`/tournaments/${tournamentId}`),
      api.get<Team[]>('/teams/my'),
    ]).then(([tRes, teamsRes]) => {
      setTournament(tRes.data)
      setTeams(teamsRes.data)
      const [firstTeam] = teamsRes.data
      if (teamsRes.data.length === 1 && firstTeam) form.setValue('teamId', firstTeam.id)
    }).catch(() => {
      toast.error('Error al cargar datos')
      router.push('/team/torneos')
    }).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId])

  async function onSubmit(values: FormValues) {
    try {
      await api.post('/tournament-teams', {
        tournamentId,
        teamId: values.teamId,
      })
      toast.success('Inscripción realizada correctamente')
      router.push('/team/torneos')
    } catch (err) {
      toast.error(extractApiError(err, 'Error al inscribir'))
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/team/torneos"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inscribirse en torneo</h1>
          <p className="text-sm text-slate-500">Inscribe tu equipo en este torneo</p>
        </div>
      </div>

      {tournament && (
        <Card className="border-brand/20 bg-brand/5">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15">
              <Trophy className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{tournament.nombre}</p>
              <p className="text-sm text-slate-600">
                {new Date(tournament.fechaInicio).toLocaleDateString('es-ES')} — {new Date(tournament.fechaFin).toLocaleDateString('es-ES')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de inscripción</CardTitle>
          <CardDescription>
            Selecciona el equipo para inscribirse.
            {tournament && ` El monto de inscripción es $${Number(tournament.montoInscripcion).toFixed(2)}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="teamId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu equipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teams.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-3 pt-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/team/torneos">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar inscripción
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
