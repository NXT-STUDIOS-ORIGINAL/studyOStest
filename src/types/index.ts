export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  preferences: UserPreferences
  createdAt: number
  updatedAt: number
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  startOfWeek: 0 | 1 | 6
  notifications: {
    enabled: boolean
    studyReminders: boolean
    breakReminders: boolean
    dailySummary: boolean
  }
  study: {
    defaultSessionDuration: number
    defaultBreakDuration: number
    longBreakInterval: number
    longBreakDuration: number
    autoStartBreaks: boolean
    autoStartSessions: boolean
  }
  dashboard: {
    showStats: boolean
    showRecentActivity: boolean
    showUpcomingTasks: boolean
    compactMode: boolean
  }
}

export interface StudySession {
  id: string
  profileId: string
  subjectId?: string
  taskId?: string
  type: 'focus' | 'break' | 'long-break'
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  plannedDuration: number
  actualDuration: number
  startedAt: number
  endedAt?: number
  pausedAt?: number
  totalPausedDuration: number
  createdAt: number
  updatedAt: number
}

export interface Subject {
  id: string
  profileId: string
  name: string
  color: string
  icon?: string
  description?: string
  archived: boolean
  createdAt: number
  updatedAt: number
}

export interface Task {
  id: string
  profileId: string
  subjectId?: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: number
  estimatedDuration?: number
  actualDuration: number
  tags: string[]
  createdAt: number
  updatedAt: number
}

export interface Note {
  id: string
  profileId: string
  subjectId?: string
  taskId?: string
  title: string
  content: string
  format: 'markdown' | 'plain' | 'rich'
  tags: string[]
  isPinned: boolean
  archived: boolean
  createdAt: number
  updatedAt: number
}

export interface Flashcard {
  id: string
  profileId: string
  deckId: string
  front: string
  back: string
  tags: string[]
  difficulty: 'new' | 'learning' | 'review' | 'mastered'
  interval: number
  easeFactor: number
  dueDate: number
  reviews: number
  lapses: number
  createdAt: number
  updatedAt: number
}

export interface FlashcardDeck {
  id: string
  profileId: string
  name: string
  description?: string
  color: string
  icon?: string
  cardsCount: number
  dueCount: number
  createdAt: number
  updatedAt: number
}

export interface Goal {
  id: string
  profileId: string
  title: string
  description?: string
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  targetValue: number
  currentValue: number
  unit: string
  startDate: number
  endDate?: number
  completed: boolean
  createdAt: number
  updatedAt: number
}

export interface Achievement {
  id: string
  profileId: string
  key: string
  name: string
  description: string
  icon: string
  unlockedAt: number
  progress: number
  maxProgress: number
}

export interface Settings {
  id: string
  profileId: string
  key: string
  value: string
  createdAt: number
  updatedAt: number
}

export type EntityType =
  | 'profile'
  | 'session'
  | 'subject'
  | 'task'
  | 'note'
  | 'flashcard'
  | 'flashcardDeck'
  | 'goal'
  | 'achievement'
  | 'settings'

export interface SyncMetadata {
  entityType: EntityType
  entityId: string
  lastModified: number
  synced: boolean
  version: number
}