import { z } from 'zod'
import type {
  UserProfile,
  UserPreferences,
  StudySession,
  Subject,
  Task,
  Note,
  Flashcard,
  FlashcardDeck,
  Goal,
  Achievement,
  Settings,
} from '../types'

export const userPreferencesSchema: z.ZodType<UserPreferences> = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.string().default('en'),
  dateFormat: z.string().default('YYYY-MM-DD'),
  timeFormat: z.enum(['12h', '24h']).default('24h'),
  startOfWeek: z.union([z.literal(0), z.literal(1), z.literal(6)]).default(1),
  notifications: z.object({
    enabled: z.boolean().default(true),
    studyReminders: z.boolean().default(true),
    breakReminders: z.boolean().default(true),
    dailySummary: z.boolean().default(false),
  }).default({
    enabled: true,
    studyReminders: true,
    breakReminders: true,
    dailySummary: false,
  }),
  study: z.object({
    defaultSessionDuration: z.number().int().positive().default(25 * 60),
    defaultBreakDuration: z.number().int().positive().default(5 * 60),
    longBreakInterval: z.number().int().positive().default(4),
    longBreakDuration: z.number().int().positive().default(15 * 60),
    autoStartBreaks: z.boolean().default(false),
    autoStartSessions: z.boolean().default(false),
  }).default({
    defaultSessionDuration: 25 * 60,
    defaultBreakDuration: 5 * 60,
    longBreakInterval: 4,
    longBreakDuration: 15 * 60,
    autoStartBreaks: false,
    autoStartSessions: false,
  }),
  dashboard: z.object({
    showStats: z.boolean().default(true),
    showRecentActivity: z.boolean().default(true),
    showUpcomingTasks: z.boolean().default(true),
    compactMode: z.boolean().default(false),
  }).default({
    showStats: true,
    showRecentActivity: true,
    showUpcomingTasks: true,
    compactMode: false,
  }),
})

export const userProfileSchema: z.ZodType<UserProfile> = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  avatar: z.string().url().optional(),
  preferences: userPreferencesSchema,
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
})

export const studySessionSchema: z.ZodType<StudySession> = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  type: z.enum(['focus', 'break', 'long-break']),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']),
  plannedDuration: z.number().int().positive(),
  actualDuration: z.number().int().nonnegative(),
  startedAt: z.number().int().positive(),
  endedAt: z.number().int().positive().optional(),
  pausedAt: z.number().int().positive().optional(),
  totalPausedDuration: z.number().int().nonnegative().default(0),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
})

export const subjectSchema: z.ZodType<Subject> = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().optional(),
  description: z.string().optional(),
  archived: z.boolean().default(false),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
})

export const taskSchema: z.ZodType<Task> = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'review', 'done', 'archived']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.number().int().positive().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  actualDuration: z.number().int().nonnegative().default(0),
  tags: z.array(z.string()).default([]),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
})

export const noteSchema: z.ZodType<Note> = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  content: z.string(),
  format: z.enum(['markdown', 'plain', 'rich']).default('markdown'),
  tags: z.array(z.string()).default([]),
  isPinned: z.boolean().default(false),
  archived: z.boolean().default(false),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
})

export const flashcardSchema: z.ZodType<Flashcard> = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  deckId: z.string().uuid(),
  front: z.string().min(1),
  back: z.string().min(1),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(['new', 'learning', 'review', 'mastered']).default('new'),
  interval: z.number().int().nonnegative().default(0),
  easeFactor: z.number().min(1.3).default(2.5),
  dueDate: z.number().int().positive(),
  reviews: z.number().int().nonnegative().default(0),
  lapses: z.number().int().nonnegative().default(0),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
})

export const flashcardDeckSchema: z.ZodType<FlashcardDeck> = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().optional(),
  cardsCount: z.number().int().nonnegative().default(0),
  dueCount: z.number().int().nonnegative().default(0),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
})

export const goalSchema: z.ZodType<Goal> = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  targetValue: z.number().positive(),
  currentValue: z.number().nonnegative().default(0),
  unit: z.string().min(1).max(50),
  startDate: z.number().int().positive(),
  endDate: z.number().int().positive().optional(),
  completed: z.boolean().default(false),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
})

export const achievementSchema: z.ZodType<Achievement> = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  icon: z.string().min(1).max(50),
  unlockedAt: z.number().int().positive(),
  progress: z.number().int().nonnegative().default(0),
  maxProgress: z.number().int().positive(),
})

export const settingsSchema: z.ZodType<Settings> = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  key: z.string().min(1).max(100),
  value: z.string(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
})

export const createProfileSchema = userProfileSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const updateProfileSchema = userProfileSchema.partial().omit({ id: true, createdAt: true })
export const createSessionSchema = studySessionSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const updateSessionSchema = studySessionSchema.partial().omit({ id: true, createdAt: true })
export const createSubjectSchema = subjectSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const updateSubjectSchema = subjectSchema.partial().omit({ id: true, createdAt: true })
export const createTaskSchema = taskSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const updateTaskSchema = taskSchema.partial().omit({ id: true, createdAt: true })
export const createNoteSchema = noteSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const updateNoteSchema = noteSchema.partial().omit({ id: true, createdAt: true })
export const createFlashcardSchema = flashcardSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const updateFlashcardSchema = flashcardSchema.partial().omit({ id: true, createdAt: true })
export const createDeckSchema = flashcardDeckSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const updateDeckSchema = flashcardDeckSchema.partial().omit({ id: true, createdAt: true })
export const createGoalSchema = goalSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const updateGoalSchema = goalSchema.partial().omit({ id: true, createdAt: true })

export type CreateProfileInput = z.infer<typeof createProfileSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>
export type CreateDeckInput = z.infer<typeof createDeckSchema>
export type UpdateDeckInput = z.infer<typeof updateDeckSchema>
export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>