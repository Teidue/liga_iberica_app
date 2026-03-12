'use client'

import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CreditCard,
  Trophy,
  Shield,
} from 'lucide-react'
import { BaseSidebar } from '@/components/sidebar'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/team', icon: LayoutDashboard },
  { label: 'Mis Equipos', href: '/team/teams', icon: Users },
  { label: 'Torneos', href: '/team/torneos', icon: Trophy },
  { label: 'Asistencia', href: '/team/asistencia', icon: CalendarDays },
  { label: 'Pagos', href: '/team/pagos', icon: CreditCard },
]

export function TeamSidebar() {
  return (
    <BaseSidebar
      navItems={NAV_ITEMS}
      accent="emerald"
      brandIcon={Shield}
      brandRole="Team Admin"
      profileHref="/team/perfil"
      dashboardHref="/team"
      defaultInitials="TA"
    />
  )
}
