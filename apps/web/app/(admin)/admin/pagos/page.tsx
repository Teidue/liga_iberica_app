'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/page-header'
import { StatsCard } from '@/components/stats-card'
import { ListSkeleton } from '@/components/list-skeleton'
import { EmptyState } from '@/components/empty-state'
import api from '@/lib/api'
import { toast } from 'sonner'
import type { Payment } from '@/lib/types'

type PaymentWithRel = Payment & {
  tournamentTeam?: {
    team?: { nombre: string }
    tournament?: { nombre: string }
  }
}

const METHOD_LABELS: Record<string, string> = {
  BINANCE: 'Binance', ZINLI: 'Zinli', TRANSFERENCIA: 'Transferencia / Pago Móvil', EFECTIVO: 'Efectivo', OTRO: 'Otro',
}

function statusIcon(p: PaymentWithRel) {
  if (p.status === 'approved') return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
  if (p.status === 'rejected') return <XCircle className="h-5 w-5 text-red-500" />
  return <Clock className="h-5 w-5 text-amber-600" />
}

function statusBg(p: PaymentWithRel) {
  if (p.status === 'approved') return 'bg-emerald-50'
  if (p.status === 'rejected') return 'bg-red-50'
  return 'bg-amber-50'
}

function PaymentRow({ p }: { p: PaymentWithRel }) {
  return (
    <Link href={`/admin/pagos/${p.id}`}>
      <div className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-3 hover:bg-slate-50">
        <div className="flex items-center gap-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${statusBg(p)}`}>
            {statusIcon(p)}
          </div>
          <div>
            <p className="font-medium text-slate-900">
              {p.tournamentTeam?.team?.nombre ?? '—'}
            </p>
            <p className="text-xs text-slate-500">
              {p.tournamentTeam?.tournament?.nombre ?? '—'} · {METHOD_LABELS[p.metodo] ?? p.metodo}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-semibold text-slate-900">€{p.monto}</p>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </Link>
  )
}

export default function PagosAdminPage() {
  const [pending, setPending] = useState<PaymentWithRel[]>([])
  const [approved, setApproved] = useState<PaymentWithRel[]>([])
  const [rejected, setRejected] = useState<PaymentWithRel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<PaymentWithRel[]>('/payments/pending'),
      api.get<PaymentWithRel[]>('/payments/approved'),
      api.get<PaymentWithRel[]>('/payments/rejected'),
    ]).then(([pRes, aRes, rRes]) => {
      setPending(pRes.data)
      setApproved(aRes.data)
      setRejected(rRes.data)
    }).catch(() => toast.error('Error al cargar pagos'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagos"
        description="Aprueba o rechaza los pagos de inscripción"
      />

      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          label="Pendientes"
          value={pending.length}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          loading={loading}
        />
        <StatsCard
          label="Aprobados"
          value={approved.length}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading}
        />
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pendientes {!loading && <Badge variant="secondary" className="ml-2">{pending.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="approved">Aprobados</TabsTrigger>
          <TabsTrigger value="rejected">
            Rechazados {!loading && rejected.length > 0 && <Badge variant="destructive" className="ml-2">{rejected.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Pagos pendientes de revisión</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ListSkeleton count={3} />
              ) : pending.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Sin pagos pendientes"
                />
              ) : (
                <div className="divide-y">{pending.map(p => <PaymentRow key={p.id} p={p} />)}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Pagos aprobados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ListSkeleton count={3} />
              ) : approved.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Sin pagos aprobados aún"
                />
              ) : (
                <div className="divide-y">{approved.map(p => <PaymentRow key={p.id} p={p} />)}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Pagos rechazados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ListSkeleton count={3} />
              ) : rejected.length === 0 ? (
                <EmptyState
                  icon={XCircle}
                  title="Sin pagos rechazados"
                />
              ) : (
                <div className="divide-y">{rejected.map(p => <PaymentRow key={p.id} p={p} />)}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
