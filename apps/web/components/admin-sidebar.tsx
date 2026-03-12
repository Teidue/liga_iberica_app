'use client'

import {
  LayoutDashboard,
  Trophy,
  CalendarDays,
  CreditCard,
  Users,
  Building2,
  UserCog,
} from 'lucide-react'
import { BaseSidebar } from '@/components/sidebar'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Torneos', href: '/admin/torneos', icon: Trophy },
  { label: 'Jornadas', href: '/admin/jornadas', icon: CalendarDays },
  { label: 'Pagos', href: '/admin/pagos', icon: CreditCard },
  { label: 'Equipos', href: '/admin/equipos', icon: Users },
  { label: 'Clubes', href: '/admin/clubes', icon: Building2 },
  { label: 'Usuarios', href: '/admin/usuarios', icon: UserCog },
]

export function AdminSidebar() {
  return (
    <BaseSidebar
      navItems={NAV_ITEMS}
      accent="indigo"
      brandIcon={Trophy}
      brandRole="Super Admin"
      profileHref="/admin/perfil"
      dashboardHref="/admin"
      defaultInitials="SA"
    />
  )
}
