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
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/Tooltip'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Subjects', href: '/subjects', icon: BookOpen },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Notes', href: '/notes', icon: FileText },
  { name: 'Flashcards', href: '/flashcards', icon: Layers },
  { name: 'Timer', href: '/timer', icon: Timer },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ open, onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const location = useLocation()

  if (!open && !collapsed) return null

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-card border-r transition-all duration-300 ease-in-out flex flex-col',
          collapsed ? 'w-16' : 'w-64',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <NavLink to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
              <span className="hidden sm:inline">StudyOS</span>
            </NavLink>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', collapsed && 'mx-auto')}
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href))
            
            if (collapsed) {
              return (
                <Tooltip key={item.name} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex h-10 w-10 mx-auto items-center justify-center rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                      title={item.name}
                    >
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center">
                    <span>{item.name}</span>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t p-4">
          <NavLink
            to="/help"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
              collapsed && 'justify-center'
            )}
          >
            <HelpCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!collapsed && <span>Help & Feedback</span>}
          </NavLink>
        </div>
      </aside>
    </>
  )
}