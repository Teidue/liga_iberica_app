'use client'

import { useEffect, useState } from 'react'
import { Trophy, CalendarDays, CreditCard, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from '@/components/stats-card'
import api from '@/lib/api'
import type { Tournament, MatchDay, Payment } from '@/lib/types'

interface Stats {
  activeTournaments: Tournament[]
  upcomingMatchDays: MatchDay[]
  pendingPayments: Payment[]
  totalTeams: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [tournamentsRes, matchDaysRes, paymentsRes, teamsRes] = await Promise.all([
          api.get<Tournament[]>('/tournaments/active'),
          api.get<MatchDay[]>('/match-days/upcoming'),
          api.get<Payment[]>('/payments/pending'),
          api.get<{ length: number }>('/teams'),
        ])
        setStats({
          activeTournaments: tournamentsRes.data,
          upcomingMatchDays: matchDaysRes.data.slice(0, 5),
          pendingPayments: paymentsRes.data,
          totalTeams: Array.isArray(teamsRes.data) ? teamsRes.data.length : 0,
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const kpis = [
    {
      label: 'Torneos activos',
      value: stats?.activeTournaments.length ?? 0,
      icon: Trophy,
      color: 'text-brand',
      bg: 'bg-brand/10',
    },
    {
      label: 'Equipos registrados',
      value: stats?.totalTeams ?? 0,
      icon: Users,
      color: 'text-brand-muted',
      bg: 'bg-brand-muted/20',
    },
    {
      label: 'Pagos pendientes',
      value: stats?.pendingPayments.length ?? 0,
      icon: CreditCard,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Próximas jornadas',
      value: stats?.upcomingMatchDays.length ?? 0,
      icon: CalendarDays,
      color: 'text-brand-light',
      bg: 'bg-brand-light/15',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Resumen general del sistema</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon, color, bg }) => (
          <StatsCard
            key={label}
            label={label}
            value={value}
            icon={icon}
            iconBg={bg}
            iconColor={color}
            loading={loading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending payments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Pagos pendientes de revisión</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : stats?.pendingPayments.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">Sin pagos pendientes</p>
            ) : (
              <ul className="divide-y">
                {stats?.pendingPayments.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium text-slate-800">
                      {(p as unknown as { tournamentTeam?: { team?: { nombre?: string } } }).tournamentTeam?.team?.nombre ?? `Pago #${p.id.slice(0, 8)}`}
                    </span>
                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                      Pendiente
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Upcoming match days */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Próximas jornadas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : stats?.upcomingMatchDays.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">Sin jornadas próximas</p>
            ) : (
              <ul className="divide-y">
                {stats?.upcomingMatchDays.map((md) => (
                  <li key={md.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium text-slate-800">
                      {md.tournament?.nombre ?? 'Jornada'}
                    </span>
                    <span className="text-slate-500">
                      {new Date(md.fecha).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
