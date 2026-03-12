'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import type { TournamentTeam, Payment } from '@/lib/types'

type TournamentTeamDetail = TournamentTeam & {
  tournament?: { id: string; nombre: string }
  team?: { id: string; nombre: string }
  payments?: Payment[]
  totalPaid?: number
  balance?: number
  paymentsCount?: number
}

const METHOD_LABELS: Record<string, string> = {
  BINANCE: 'Binance', ZINLI: 'Zinli', TRANSFERENCIA: 'Transferencia / Pago Móvil', EFECTIVO: 'Efectivo', OTRO: 'Otro',
}

export default function PagoTeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [inscription, setInscription] = useState<TournamentTeamDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<TournamentTeamDetail>(`/tournament-teams/${id}`)
      .then(r => setInscription(r.data))
      .catch(() => { toast.error('Inscripción no encontrada'); router.push('/team/pagos') })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!inscription) return null

  const totalPaid = inscription.totalPaid ?? 0
  const totalPending = inscription.payments
    ?.filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.monto), 0) ?? 0
  const balance = inscription.balance ?? (inscription.montoInscripcion - totalPaid)
  const alDia = balance <= 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/team/pagos"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{inscription.tournament?.nombre ?? '—'}</h1>
            <p className="text-sm text-slate-500">{inscription.team?.nombre ?? '—'}</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/team/pagos/new">
            Registrar pago
            <Plus className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Total inscripción</p>
            <p className="mt-1 text-xl font-bold text-slate-900">${inscription.montoInscripcion}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Aprobado</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">${totalPaid}</p>
          </CardContent>
        </Card>
        {totalPending > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-5">
              <p className="text-xs text-amber-600">Pendiente aprobación</p>
              <p className="mt-1 text-xl font-bold text-amber-700">${totalPending}</p>
            </CardContent>
          </Card>
        )}
        <Card className={alDia ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="p-5">
            <p className={`text-xs ${alDia ? 'text-emerald-600' : 'text-red-500'}`}>Saldo por pagar</p>
            <p className={`mt-1 text-xl font-bold ${alDia ? 'text-emerald-700' : 'text-red-600'}`}>
              ${alDia ? 0 : balance}
            </p>
          </CardContent>
        </Card>
      </div>

      {!alDia && totalPending > 0 && (
        <p className="text-xs text-amber-600">
          Tienes ${totalPending} en pagos pendientes de aprobación por el administrador. El saldo por pagar se actualizará cuando sean aprobados.
        </p>
      )}

      <Badge variant={alDia ? 'default' : 'destructive'} className="text-sm">
        {alDia ? 'Inscripción al día' : `Saldo por pagar: $${balance}`}
      </Badge>

      {/* Payments list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Historial de pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!inscription.payments || inscription.payments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">Sin pagos registrados aún</p>
              <Button variant="link" asChild className="mt-1">
                <Link href="/team/pagos/new">Registrar el primero</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {inscription.payments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${p.status === 'approved' ? 'bg-emerald-50' : p.status === 'rejected' ? 'bg-red-50' : 'bg-amber-50'}`}>
                      {p.status === 'approved'
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        : p.status === 'rejected'
                        ? <XCircle className="h-4 w-4 text-red-500" />
                        : <Clock className="h-4 w-4 text-amber-600" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">€{p.monto} · {METHOD_LABELS[p.metodo] ?? p.metodo}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(p.fecha).toLocaleDateString('es-ES')}
                        {p.referencia ? ` · ${p.referencia}` : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant={p.status === 'approved' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {p.status === 'approved' ? 'Aprobado' : p.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
