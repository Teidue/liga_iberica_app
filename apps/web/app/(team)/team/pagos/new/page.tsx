'use client'

import { useEffect, useState } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormPage } from '@/components/form-page'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
import type { TournamentTeam, Team } from '@/lib/types'

type TournamentTeamWithRel = TournamentTeam & { tournament?: { nombre: string }; team?: { nombre: string } }

const schema = z.object({
  tournamentTeamId: z.string().min(1, 'Selecciona una inscripción'),
  monto: z.number().positive('Debe ser un monto positivo'),
  fecha: z.string().min(1, 'Requerido'),
  metodo: z.enum(['BINANCE', 'ZINLI', 'TRANSFERENCIA', 'EFECTIVO', 'OTRO']),
  referencia: z.string().optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

const METHOD_LABELS: Record<string, string> = {
  BINANCE: 'Binance', ZINLI: 'Zinli', TRANSFERENCIA: 'Transferencia / Pago Móvil', EFECTIVO: 'Efectivo', OTRO: 'Otro',
}

const REFERENCE_PLACEHOLDERS: Record<string, string> = {
  BINANCE: 'Ej: TxID de la transacción en Binance',
  ZINLI: 'Ej: ID de transacción Zinli',
  TRANSFERENCIA: 'Ej: últimos 4 dígitos de la referencia (3421)',
  OTRO: 'Ej: Referencia del comprobante',
}

export default function NewPagoPage() {
  const router = useRouter()
  const [inscriptions, setInscriptions] = useState<TournamentTeamWithRel[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tournamentTeamId: '', monto: 0, fecha: new Date().toISOString().split('T')[0],
      metodo: 'TRANSFERENCIA', referencia: '',
    },
  })
  const { isSubmitting } = form.formState
  const metodo = form.watch('metodo')

  useEffect(() => {
    api.get<Team[]>('/teams/my')
      .then(async teamsRes => {
        const all: TournamentTeamWithRel[] = []
        for (const team of teamsRes.data) {
          const insRes = await api.get<TournamentTeamWithRel[]>(`/tournament-teams?teamId=${team.id}`)
          all.push(...insRes.data)
        }
        setInscriptions(all)
      })
      .catch(() => toast.error('Error al cargar inscripciones'))
  }, [])

  async function onSubmit(values: FormValues) {
    try {
      await api.post('/payments', {
        tournamentTeamId: values.tournamentTeamId,
        monto: values.monto,
        fecha: values.fecha,
        metodo: values.metodo,
        referencia: values.referencia || null,
      })
      toast.success('Pago registrado — pendiente de aprobación')
      router.push('/team/pagos')
    } catch (err) {
      toast.error(extractApiError(err, 'Error al registrar'))
    }
  }

  return (
    <FormPage
      title="Registrar Pago"
      description="El pago quedará pendiente de aprobación"
      backHref="/team/pagos"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del pago</CardTitle>
          <CardDescription>Indica la inscripción, monto y método de pago</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="tournamentTeamId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Inscripción</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecciona torneo/equipo" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inscriptions.map(ins => (
                        <SelectItem key={ins.id} value={ins.id}>
                          {ins.tournament?.nombre ?? '—'} — {ins.team?.nombre ?? '—'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="monto" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto ($)</FormLabel>
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
                <FormField control={form.control} name="fecha" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="metodo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de pago</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(METHOD_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {metodo === 'EFECTIVO' ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  El pago en efectivo se entrega directamente al administrador, quien lo aprobará al recibirlo.
                </p>
              ) : (
                <FormField control={form.control} name="referencia" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referencia (opcional)</FormLabel>
                    <FormControl><Input placeholder={REFERENCE_PLACEHOLDERS[metodo] ?? 'Referencia del pago'} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/team/pagos">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar pago
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </FormPage>
  )
}
