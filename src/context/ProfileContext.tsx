import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { UserProfile, UserPreferences } from '../types'
import { db, generateId, now } from '../db'

interface ProfileContextType {
  profile: UserProfile | null
  loading: boolean
  error: Error | null
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      let activeProfile = await db.getActiveProfile()
      
      if (!activeProfile) {
        activeProfile = {
          id: generateId(),
          name: 'Student',
          email: 'student@studyos.local',
          preferences: {
            theme: 'system',
            language: 'en',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h',
            startOfWeek: 1,
            notifications: {
              enabled: true,
              studyReminders: true,
              breakReminders: true,
              dailySummary: false,
            },
            study: {
              defaultSessionDuration: 25 * 60,
              defaultBreakDuration: 5 * 60,
              longBreakInterval: 4,
              longBreakDuration: 15 * 60,
              autoStartBreaks: false,
              autoStartSessions: false,
            },
            dashboard: {
              showStats: true,
              showRecentActivity: true,
              showUpcomingTasks: true,
              compactMode: false,
            },
          },
          createdAt: now(),
          updatedAt: now(),
        }
        await db.profiles.add(activeProfile)
      }
      
      setProfile(activeProfile)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load profile'))
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return
    
    try {
      const updatedProfile = {
        ...profile,
        ...updates,
        id: profile.id,
        createdAt: profile.createdAt,
        updatedAt: now(),
      }
      
      await db.profiles.put(updatedProfile)
      setProfile(updatedProfile)
    } catch (err) {
      console.error('Failed to update profile:', err)
      throw err
    }
  }, [profile])

  const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    if (!profile) return
    
    try {
      const updatedPreferences = {
        ...profile.preferences,
        ...preferences,
      }
      
      const updatedProfile = {
        ...profile,
        preferences: updatedPreferences,
        updatedAt: now(),
      }
      
      await db.profiles.put(updatedProfile)
      setProfile(updatedProfile)
    } catch (err) {
      console.error('Failed to update preferences:', err)
      throw err
    }
  }, [profile])

  const refreshProfile = useCallback(async () => {
    await loadProfile()
  }, [loadProfile])

  return (
    <ProfileContext.Provider value={{
      profile,
      loading,
      error,
      updateProfile,
      updatePreferences,
      refreshProfile,
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}