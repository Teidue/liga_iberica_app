import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface EntityCardProps {
  href: string
  iconBg: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  title: string
  subtitle?: React.ReactNode
  right?: React.ReactNode
}

export function EntityCard({
  href,
  iconBg,
  icon: Icon,
  iconColor,
  title,
  subtitle,
  right,
}: EntityCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-4">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{title}</p>
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {right}
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
