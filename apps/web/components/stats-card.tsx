import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StatsCardProps {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  loading?: boolean
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  loading,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          {loading ? (
            <Skeleton className="mb-1 h-7 w-10" />
          ) : (
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          )}
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
