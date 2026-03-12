'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Settings, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

type AccentColor = 'indigo' | 'emerald'

export interface SidebarNavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface BaseSidebarProps {
  navItems: SidebarNavItem[]
  accent: AccentColor
  brandIcon: React.ComponentType<{ className?: string }>
  brandRole: string
  profileHref: string
  dashboardHref: string
  defaultInitials: string
}

const ACCENT_CLASSES: Record<AccentColor, {
  sidebarBg: string
  brand: string
  active: string
  activeIcon: string
  inactive: string
  inactiveIcon: string
  separator: string
  avatar: string
  avatarText: string
  nameText: string
  emailText: string
  actionBtn: string
  logoutBtn: string
}> = {
  indigo: {
    sidebarBg:   'bg-brand-dark',
    brand:       'bg-white/15',
    active:      'bg-white/15 text-white',
    activeIcon:  'text-white',
    inactive:    'text-white/65 hover:bg-white/10 hover:text-white',
    inactiveIcon:'text-white/40',
    separator:   'bg-white/10',
    avatar:      'bg-brand-light',
    avatarText:  'text-white',
    nameText:    'text-white',
    emailText:   'text-white/55',
    actionBtn:   'text-white/65 hover:bg-white/10 hover:text-white',
    logoutBtn:   'text-white/65 hover:bg-red-500/15 hover:text-red-300',
  },
  emerald: {
    sidebarBg:   'bg-brand-dark',
    brand:       'bg-white/15',
    active:      'bg-white/15 text-white',
    activeIcon:  'text-white',
    inactive:    'text-white/65 hover:bg-white/10 hover:text-white',
    inactiveIcon:'text-white/40',
    separator:   'bg-white/10',
    avatar:      'bg-brand-muted',
    avatarText:  'text-brand-darkest',
    nameText:    'text-white',
    emailText:   'text-white/55',
    actionBtn:   'text-white/65 hover:bg-white/10 hover:text-white',
    logoutBtn:   'text-white/65 hover:bg-red-500/15 hover:text-red-300',
  },
}

export function BaseSidebar({
  navItems,
  accent,
  brandIcon: BrandIcon,
  brandRole,
  profileHref,
  dashboardHref,
  defaultInitials,
}: BaseSidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const cls = ACCENT_CLASSES[accent]

  const initials = user?.nombre
    ? user.nombre
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : defaultInitials

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cls.brand}`}>
          <BrandIcon className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">Liga Ibérica</p>
          <p className="text-xs text-white/55">{brandRole}</p>
        </div>
      </div>

      <Separator className={cls.separator} />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active =
              href === dashboardHref ? pathname === dashboardHref : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active ? cls.active : cls.inactive,
                  )}
                >
                  <Icon className={cn('h-4 w-4', active ? cls.activeIcon : cls.inactiveIcon)} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator className={cls.separator} />

      {/* User footer */}
      <div className="px-3 py-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className={`${cls.avatar} ${cls.avatarText} text-xs font-semibold`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <p className={`truncate text-sm font-medium ${cls.nameText}`}>{user?.nombre}</p>
            <p className={`truncate text-xs ${cls.emailText}`}>{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={`w-full justify-start gap-2 ${cls.actionBtn}`}
          asChild
        >
          <Link href={profileHref}>
            <Settings className="h-4 w-4" />
            Mi perfil
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`w-full justify-start gap-2 ${cls.logoutBtn}`}
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex lg:w-60 lg:flex-col ${cls.sidebarBg}`}>
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className={`flex items-center justify-between px-4 py-3 lg:hidden ${cls.sidebarBg}`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${cls.brand}`}>
            <BrandIcon className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white">Liga Ibérica</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:bg-white/10 hover:text-white"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className={`absolute left-0 top-0 h-full w-72 shadow-2xl ${cls.sidebarBg}`}>
            <div className="flex justify-end px-4 pt-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
