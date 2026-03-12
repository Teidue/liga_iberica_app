'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import api from '@/lib/api'
import { extractApiError } from '@/lib/utils'
import type { Payment } from '@/lib/types'

type PaymentDetail = Payment & {
  tournamentTeam?: {
    id: string
    montoInscripcion: number
    team?: { id: string; nombre: string }
    tournament?: { id: string; nombre: string }
  }
}

const METHOD_LABELS: Record<string, string> = {
  BINANCE: 'Binance', ZINLI: 'Zinli', TRANSFERENCIA: 'Transferencia / Pago Móvil', EFECTIVO: 'Efectivo', OTRO: 'Otro',
}

export default function PagoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    api.get<PaymentDetail>(`/payments/${id}`)
      .then(r => setPayment(r.data))
      .catch(() => { toast.error('Pago no encontrado'); router.push('/admin/pagos') })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleAction(action: 'approve' | 'reject') {
    setProcessing(true)
    try {
      await api.post(`/payments/${id}/${action}`)
      toast.success(action === 'approve' ? 'Pago aprobado' : 'Pago rechazado')
      router.push('/admin/pagos')
    } catch (err) {
      toast.error(extractApiError(err, 'Error'))
      setConfirmAction(null)
    } finally {
      setProcessing(false)
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

  if (!payment) return null

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/pagos"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Detalle del Pago</h1>
          <p className="text-sm text-slate-500">Revisa y gestiona este pago</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Información del pago</CardTitle>
          <Badge
            variant={payment.status === 'approved' ? 'default' : payment.status === 'rejected' ? 'destructive' : 'secondary'}
          >
            {payment.status === 'approved' ? 'Aprobado' : payment.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Equipo</p>
              <p className="font-semibold text-slate-900">{payment.tournamentTeam?.team?.nombre ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Torneo</p>
              <p className="font-semibold text-slate-900">{payment.tournamentTeam?.tournament?.nombre ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Monto</p>
              <p className="font-semibold text-slate-900">€{payment.monto}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Método</p>
              <p className="font-semibold text-slate-900">{METHOD_LABELS[payment.metodo] ?? payment.metodo}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Fecha</p>
              <p className="font-semibold text-slate-900">{new Date(payment.fecha).toLocaleDateString('es-ES')}</p>
            </div>
            {payment.referencia && (
              <div>
                <p className="text-xs text-slate-500">Referencia</p>
                <p className="font-semibold text-slate-900">{payment.referencia}</p>
              </div>
            )}
          </div>

          {payment.tournamentTeam && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Total inscripción</p>
                <p className="font-semibold">€{payment.tournamentTeam.montoInscripcion}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {payment.status === 'rejected' && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-sm text-red-700">Este pago fue rechazado y no contabiliza en el balance.</p>
        </div>
      )}

      {payment.status === 'pending' && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setConfirmAction('reject')}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Rechazar
          </Button>
          <Button className="flex-1" onClick={() => setConfirmAction('approve')}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Aprobar
          </Button>
        </div>
      )}

      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'approve' ? '¿Aprobar pago?' : '¿Rechazar pago?'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'approve'
                ? `Se aprobará el pago de €${payment.monto} de ${payment.tournamentTeam?.team?.nombre ?? '—'}.`
                : `Se rechazará el pago de €${payment.monto} de ${payment.tournamentTeam?.team?.nombre ?? '—'}.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancelar</Button>
            <Button
              variant={confirmAction === 'reject' ? 'destructive' : 'default'}
              onClick={() => confirmAction && handleAction(confirmAction)}
              disabled={processing}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmAction === 'approve' ? 'Aprobar' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
