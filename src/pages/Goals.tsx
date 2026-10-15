import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Target, Edit, Trash2, Archive, MoreHorizontal, Flag, Calendar, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '../components/ui/DropdownMenu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../components/ui/Dialog'
import { Label } from '../components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Separator } from '../components/ui/Separator'
import { useProfile } from '../context/ProfileContext'
import { db, generateId, now } from '../db'
import { goalSchema, createGoalSchema, updateGoalSchema } from '../validation/schemas'
import type { Goal } from '../types'
import { cn, formatDate } from '../lib/utils'

const goalTypes = [
  { value: 'daily', label: 'Daily', icon: 'calendar' },
  { value: 'weekly', label: 'Weekly', icon: 'calendar-days' },
  { value: 'monthly', label: 'Monthly', icon: 'calendar' },
  { value: 'custom', label: 'Custom', icon: 'target' },
] as const

export function Goals() {
  const { profile } = useProfile()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'daily' as Goal['type'],
    targetValue: 1,
    unit: 'sessions',
    startDate: Date.now(),
    endDate: '',
  })

  useEffect(() => {
    loadGoals()
  }, [profile, showCompleted])

  const loadGoals = async () => {
    if (!profile) return
    setLoading(true)
    const data = await db.goals
      .where('profileId')
      .equals(profile.id)
      .filter(g => showCompleted || !g.completed)
      .sortBy('createdAt')
    setGoals(data.reverse())
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      const startDate = new Date(formData.startDate).getTime()
      const endDate = formData.endDate ? new Date(formData.endDate).getTime() : undefined

      if (editingGoal) {
        const validated = updateGoalSchema.parse({
          ...formData,
          id: editingGoal.id,
          profileId: profile.id,
          startDate,
          endDate,
          updatedAt: now(),
        })
        await db.goals.put(validated)
      } else {
        const validated = createGoalSchema.parse({
          ...formData,
          id: generateId(),
          profileId: profile.id,
          currentValue: 0,
          completed: false,
          startDate,
          endDate,
          createdAt: now(),
          updatedAt: now(),
        })
        await db.goals.add(validated)
      }
      setDialogOpen(false)
      setEditingGoal(null)
      resetForm()
      loadGoals()
    } catch (error) {
      console.error('Failed to save goal:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'daily',
      targetValue: 1,
      unit: 'sessions',
      startDate: Date.now(),
      endDate: '',
    })
  }

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      title: goal.title,
      description: goal.description || '',
      type: goal.type,
      targetValue: goal.targetValue,
      unit: goal.unit,
      startDate: goal.startDate,
      endDate: goal.endDate ? formatDate(goal.endDate, 'YYYY-MM-DD') : '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (goal: Goal) => {
    if (!confirm(`Delete "${goal.title}"? This cannot be undone.`)) return
    await db.goals.delete(goal.id)
    loadGoals()
  }

  const handleToggleComplete = async (goal: Goal) => {
    await db.goals.update(goal.id, { 
      completed: !goal.completed, 
      currentValue: goal.completed ? goal.currentValue : goal.targetValue,
      updatedAt: now() 
    })
    loadGoals()
  }

  const handleNewClick = () => {
    const [searchParams] = useSearchParams()
    if (searchParams.get('new') === 'true') {
      setDialogOpen(true)
    }
  }

  React.useEffect(() => {
    handleNewClick()
  }, [])

  const getProgress = (goal: Goal) => Math.min((goal.currentValue / goal.targetValue) * 100, 100)
  const isOverdue = (goal: Goal) => goal.endDate && !goal.completed && goal.endDate < Date.now()

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
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground mt-1">Track your study objectives and milestones</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingGoal(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'New Goal'}</DialogTitle>
              <DialogDescription>
                {editingGoal ? 'Update your goal details' : 'Create a new goal to track your progress'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Complete 10 study sessions this week"
                    required
                    maxLength={200}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add details about this goal..."
                    rows={3}
                    maxLength={500}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Goal['type'] })}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {goalTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="sessions"
                      maxLength={50}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="targetValue">Target Value</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    min="1"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formatDate(formData.startDate, 'YYYY-MM-DD')}
                      onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value).getTime() })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date (optional)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingGoal ? 'Save Changes' : 'Create Goal'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant={showCompleted ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowCompleted(!showCompleted)}
        >
          {showCompleted ? 'Hide Completed' : 'Show Completed'}
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-medium">No goals yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {showCompleted ? 'No completed goals' : 'Create your first goal to start tracking progress'}
            </p>
            {!showCompleted && (
              <Button asChild className="mt-4">
                <Link to="?new=true">Add Goal</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <Card key={goal.id} className={cn(goal.completed && 'opacity-60')}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Flag className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <h3 className={cn('font-semibold truncate', goal.completed && 'line-through')}>{goal.title}</h3>
                    </div>
                    {goal.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs capitalize">{goal.type}</Badge>
                      <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                      {goal.endDate && (
                        <span className={cn(isOverdue(goal) ? 'text-destructive' : '')}>
                          <Calendar className="inline h-3 w-3 mr-1" aria-hidden="true" />
                          Due: {formatDate(goal.endDate)}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full transition-all', goal.completed ? 'bg-green-500' : 'bg-primary')}
                        style={{ width: `${getProgress(goal)}%` }}
                      />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(goal)} disabled={goal.completed}>
                        <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleComplete(goal)}>
                        <TrendingUp className="mr-2 h-4 w-4" aria-hidden="true" />
                        {goal.completed ? 'Mark Incomplete' : 'Mark Complete'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(goal)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}