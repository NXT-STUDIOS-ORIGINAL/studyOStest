import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { UserProfile, UserPreferences } from '../types'
import { db, generateId, now } from '../db'

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  const updateResolvedTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    let resolved: 'light' | 'dark'
    if (newTheme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      resolved = newTheme
    }
    setResolvedTheme(resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    localStorage.setItem('studyos-theme', newTheme)
  }, [])

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('studyos-theme') as 'light' | 'dark' | 'system' | null
    const initialTheme = stored || 'system'
    setThemeState(initialTheme)
    updateResolvedTheme(initialTheme)
  }, [updateResolvedTheme])

  useEffect(() => {
    if (!mounted) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        updateResolvedTheme('system')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted, updateResolvedTheme])

  const setTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme)
    updateResolvedTheme(newTheme)
  }, [updateResolvedTheme])

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }, [resolvedTheme, setTheme])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}