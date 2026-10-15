import React from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Target,
  CheckSquare,
  FileText,
  Layers,
  Timer,
  Plus,
  Clock,
  Flame,
  Trophy,
  Star,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Separator } from '../components/ui/Separator'
import { useProfile } from '../context/ProfileContext'
import { db } from '../db'
import { formatDuration } from '../lib/utils'

const quickActions = [
  { name: 'Start Timer', href: '/timer', icon: Timer, description: 'Begin a focus session', primary: true },
  { name: 'Add Task', href: '/tasks?new=true', icon: CheckSquare, description: 'Create a new task', primary: false },
  { name: 'New Note', href: '/notes?new=true', icon: FileText, description: 'Take a quick note', primary: false },
  { name: 'Add Subject', href: '/subjects?new=true', icon: BookOpen, description: 'Organize your studies', primary: false },
]

const overviewCards = [
  { name: 'Subjects', href: '/subjects', icon: BookOpen, color: 'bg-blue-500', countKey: 'subjects' },
  { name: 'Active Goals', href: '/goals', icon: Target, color: 'bg-purple-500', countKey: 'goals' },
  { name: 'Pending Tasks', href: '/tasks', icon: CheckSquare, color: 'bg-orange-500', countKey: 'tasks' },
  { name: 'Study Time', href: '/timer', icon: Clock, color: 'bg-green-500', countKey: 'studyTime', isDuration: true },
]

const achievements = [
  { key: 'first_session', name: 'First Steps', description: 'Complete your first study session', icon: Star, progressKey: 'first_session' },
  { key: 'streak_3', name: 'Getting Started', description: 'Study for 3 days in a row', icon: Flame, progressKey: 'streak_3' },
  { key: 'streak_7', name: 'Week Warrior', description: 'Study for 7 days in a row', icon: Trophy, progressKey: 'streak_7' },
  { key: 'hours_10', name: 'Dedicated', description: 'Accumulate 10 hours of study time', icon: Clock, progressKey: 'hours_10' },
  { key: 'tasks_10', name: 'Task Master', description: 'Complete 10 tasks', icon: CheckSquare, progressKey: 'tasks_10' },
]

export function Dashboard() {
  const { profile, loading } = useProfile()
  const [stats, setStats] = React.useState({
    subjects: 0,
    goals: 0,
    tasks: 0,
    studyTime: 0,
  })
  const [achievementProgress, setAchievementProgress] = React.useState<Record<string, { progress: number; maxProgress: number; unlocked: boolean }>>({})

  React.useEffect(() => {
    async function loadStats() {
      if (!profile) return
      
      const [subjectsCount, goalsCount, tasksCount, sessions] = await Promise.all([
        db.subjects.where('profileId').equals(profile.id).count(),
        db.goals.where('profileId').equals(profile.id).count(),
        db.tasks.where('profileId').equals(profile.id).and(t => t.status !== 'done' && t.status !== 'archived').count(),
        db.sessions.where('profileId').equals(profile.id).and(s => s.status === 'completed').toArray(),
      ])
      
      const totalStudyTime = sessions.reduce((sum, s) => sum + s.actualDuration, 0)
      
      setStats({
        subjects: subjectsCount,
        goals: goalsCount,
        tasks: tasksCount,
        studyTime: totalStudyTime,
      })

      const achievementsData = await db.achievements.where('profileId').equals(profile.id).toArray()
      const progressMap: Record<string, { progress: number; maxProgress: number; unlocked: boolean }> = {}
      achievementsData.forEach(a => {
        progressMap[a.key] = {
          progress: a.progress,
          maxProgress: a.maxProgress,
          unlocked: a.unlockedAt > 0,
        }
      })
      setAchievementProgress(progressMap)
    }
    loadStats()
  }, [profile])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.name || 'Student'}</h1>
          <p className="text-muted-foreground mt-1">
            Ready to continue your learning journey?
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="lg">
            <Link to="/timer">
              <Timer className="mr-2 h-4 w-4" aria-hidden="true" />
              Start Session
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => (
          <Card key={card.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.name}</p>
                  <p className="text-3xl font-bold mt-1">
                    {card.isDuration ? formatDuration(stats[card.countKey]) : stats[card.countKey]}
                  </p>
                </div>
                <div className={cn('p-3 rounded-full', card.color)}>
                  <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild className="mt-4 w-full">
                <Link to={card.href} className="flex items-center justify-center gap-1">
                  View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-4 lg:col-span-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Button
                  key={action.name}
                  variant={action.primary ? 'default' : 'outline'}
                  asChild
                  className="h-auto p-4 text-left justify-start gap-3"
                >
                  <Link to={action.href}>
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <action.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{action.name}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <Plus className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 lg:col-span-3">
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {achievements.map((achievement) => {
                const progress = achievementProgress[achievement.key] || { progress: 0, maxProgress: 1, unlocked: false }
                const percentage = Math.min((progress.progress / progress.maxProgress) * 100, 100)
                return (
                  <div key={achievement.key} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={cn('p-2 rounded-full', progress.unlocked ? 'bg-yellow-100 text-yellow-600' : 'bg-muted text-muted-foreground')}>
                      <achievement.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{achievement.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{achievement.description}</p>
                      <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                        <div
                          className={cn('h-full transition-all', progress.unlocked ? 'bg-yellow-500' : 'bg-primary')}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    {progress.unlocked && (
                      <Badge variant="success" className="text-xs">Unlocked</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-4" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Study Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-medium">No sessions yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Start your first study session to see your history here.
              </p>
              <Button asChild className="mt-4">
                <Link to="/timer">Start Session</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-medium">No tasks yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first task to stay organized.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link to="/tasks?new=true">Add Task</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Flame className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-medium">0 day streak</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Study daily to build your streak.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link to="/timer">Start Today</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ')
}