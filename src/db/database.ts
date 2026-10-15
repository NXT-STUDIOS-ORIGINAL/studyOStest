import Dexie, { type Table } from 'dexie'
import type {
  UserProfile,
  StudySession,
  Subject,
  Task,
  Note,
  Flashcard,
  FlashcardDeck,
  Goal,
  Achievement,
  Settings,
  SyncMetadata,
} from '../types'

const DB_NAME = 'StudyOS'
const DB_VERSION = 1

class StudyOSDatabase extends Dexie {
  profiles!: Table<UserProfile>
  sessions!: Table<StudySession>
  subjects!: Table<Subject>
  tasks!: Table<Task>
  notes!: Table<Note>
  flashcards!: Table<Flashcard>
  flashcardDecks!: Table<FlashcardDeck>
  goals!: Table<Goal>
  achievements!: Table<Achievement>
  settings!: Table<Settings>
  syncMetadata!: Table<SyncMetadata>

  constructor() {
    super(DB_NAME)
    this.version(DB_VERSION).stores({
      profiles: '++id, email, createdAt, updatedAt',
      sessions: '++id, profileId, subjectId, taskId, type, status, startedAt, endedAt, createdAt, updatedAt',
      subjects: '++id, profileId, name, archived, createdAt, updatedAt',
      tasks: '++id, profileId, subjectId, status, priority, dueDate, createdAt, updatedAt',
      notes: '++id, profileId, subjectId, taskId, isPinned, archived, createdAt, updatedAt',
      flashcards: '++id, profileId, deckId, difficulty, dueDate, createdAt, updatedAt',
      flashcardDecks: '++id, profileId, name, createdAt, updatedAt',
      goals: '++id, profileId, type, completed, startDate, endDate, createdAt, updatedAt',
      achievements: '++id, profileId, key, unlockedAt, createdAt',
      settings: '++id, profileId, key, createdAt, updatedAt',
      syncMetadata: '++id, entityType, entityId, lastModified, synced, version',
    })

    this.on('populate', () => this.populateDefaults())
  }

  private async populateDefaults() {
    const now = Date.now()
    const defaultProfile: UserProfile = {
      id: crypto.randomUUID(),
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
      createdAt: now,
      updatedAt: now,
    }

    await this.profiles.add(defaultProfile)

    const defaultSubjects: Subject[] = [
      {
        id: crypto.randomUUID(),
        profileId: defaultProfile.id,
        name: 'Mathematics',
        color: '#3b82f6',
        icon: 'calculator',
        description: 'Algebra, Calculus, Statistics',
        archived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        profileId: defaultProfile.id,
        name: 'Computer Science',
        color: '#8b5cf6',
        icon: 'code',
        description: 'Programming, Algorithms, Data Structures',
        archived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        profileId: defaultProfile.id,
        name: 'Physics',
        color: '#ef4444',
        icon: 'atom',
        description: 'Mechanics, Thermodynamics, Quantum',
        archived: false,
        createdAt: now,
        updatedAt: now,
      },
    ]

    await this.subjects.bulkAdd(defaultSubjects)

    const defaultAchievements: Achievement[] = [
      {
        id: crypto.randomUUID(),
        profileId: defaultProfile.id,
        key: 'first_session',
        name: 'First Steps',
        description: 'Complete your first study session',
        icon: 'star',
        unlockedAt: 0,
        progress: 0,
        maxProgress: 1,
      },
      {
        id: crypto.randomUUID(),
        profileId: defaultProfile.id,
        key: 'streak_3',
        name: 'Getting Started',
        description: 'Study for 3 days in a row',
        icon: 'flame',
        unlockedAt: 0,
        progress: 0,
        maxProgress: 3,
      },
      {
        id: crypto.randomUUID(),
        profileId: defaultProfile.id,
        key: 'streak_7',
        name: 'Week Warrior',
        description: 'Study for 7 days in a row',
        icon: 'trophy',
        unlockedAt: 0,
        progress: 0,
        maxProgress: 7,
      },
      {
        id: crypto.randomUUID(),
        profileId: defaultProfile.id,
        key: 'hours_10',
        name: 'Dedicated',
        description: 'Accumulate 10 hours of study time',
        icon: 'clock',
        unlockedAt: 0,
        progress: 0,
        maxProgress: 10 * 3600,
      },
      {
        id: crypto.randomUUID(),
        profileId: defaultProfile.id,
        key: 'tasks_10',
        name: 'Task Master',
        description: 'Complete 10 tasks',
        icon: 'check-circle',
        unlockedAt: 0,
        progress: 0,
        maxProgress: 10,
      },
    ]

    await this.achievements.bulkAdd(defaultAchievements)
  }

  async getActiveProfile(): Promise<UserProfile | undefined> {
    return this.profiles.orderBy('updatedAt').reverse().first()
  }

  async setActiveProfile(profileId: string): Promise<void> {
    const profile = await this.profiles.get(profileId)
    if (profile) {
      profile.updatedAt = Date.now()
      await this.profiles.put(profile)
    }
  }

  async clearAllData(): Promise<void> {
    await this.transaction('rw', this.tables, async () => {
      for (const table of this.tables) {
        await table.clear()
      }
    })
    await this.populateDefaults()
  }
}

export const db = new StudyOSDatabase()

export async function initializeDatabase(): Promise<void> {
  try {
    await db.open()
    console.log('StudyOS database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function now(): number {
  return Date.now()
}