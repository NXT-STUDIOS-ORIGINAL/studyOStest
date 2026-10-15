import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Target,
  CheckSquare,
  FileText,
  Layers,
  Timer,
  Settings,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const mainNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Subjects', href: '/subjects', icon: BookOpen },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
]

const moreNavItems = [
  { name: 'Notes', href: '/notes', icon: FileText },
  { name: 'Flashcards', href: '/flashcards', icon: Layers },
  { name: 'Timer', href: '/timer', icon: Timer },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function MobileNav({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const location = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card" aria-label="Mobile navigation">
      <div className="grid grid-cols-5">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href))
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
        <div className="relative">
          <button
            className="flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium text-muted-foreground"
            onClick={onOpenSidebar}
            aria-label="More options"
            aria-expanded="false"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            <span>More</span>
          </button>
        </div>
      </div>
    </nav>
  )
}