import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, CheckSquare, Edit, Trash2, Archive, MoreHorizontal, Flag, Calendar, Clock, ArrowUpDown } from 'lucide-react'
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
import { taskSchema, createTaskSchema, updateTaskSchema } from '../validation/schemas'
import type { Task, Subject } from '../types'
import { cn, formatDate, formatDuration } from '../lib/utils'

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-gray-500' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
] as const

const statuses = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
] as const

export function Tasks() {
  const { profile } = useProfile()
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    dueDate: '',
    estimatedDuration: '',
    tags: '',
  })

  useEffect(() => {
    loadData()
  }, [profile, filterStatus, filterPriority])

  const loadData = async () => {
    if (!profile) return
    setLoading(true)
    const [tasksData, subjectsData] = await Promise.all([
      db.tasks.where('profileId').equals(profile.id).toArray(),
      db.subjects.where('profileId').equals(profile.id).filter(s => !s.archived).toArray(),
    ])
    
    let filtered = tasksData
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus)
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === filterPriority)
    }
    
    filtered.sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1
      if (b.status === 'done' && a.status !== 'done') return -1
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      return (priorityOrder[b.priority] - priorityOrder[a.priority]) || a.createdAt - b.createdAt
    })
    
    setTasks(filtered)
    setSubjects(subjectsData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      const dueDate = formData.dueDate ? new Date(formData.dueDate).getTime() : undefined
      const estimatedDuration = formData.estimatedDuration ? parseInt(formData.estimatedDuration) * 60 : undefined
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean)

      if (editingTask) {
        const validated = updateTaskSchema.parse({
          ...formData,
          id: editingTask.id,
          profileId: profile.id,
          subjectId: formData.subjectId || undefined,
          dueDate,
          estimatedDuration,
          tags,
          updatedAt: now(),
        })
        await db.tasks.put(validated)
      } else {
        const validated = createTaskSchema.parse({
          ...formData,
          id: generateId(),
          profileId: profile.id,
          subjectId: formData.subjectId || undefined,
          dueDate,
          estimatedDuration,
          tags,
          actualDuration: 0,
          createdAt: now(),
          updatedAt: now(),
        })
        await db.tasks.add(validated)
      }
      setDialogOpen(false)
      setEditingTask(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to save task:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subjectId: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      estimatedDuration: '',
      tags: '',
    })
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    const subject = subjects.find(s => s.id === task.subjectId)
    setFormData({
      title: task.title,
      description: task.description || '',
      subjectId: task.subjectId || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? formatDate(task.dueDate, 'YYYY-MM-DD') : '',
      estimatedDuration: task.estimatedDuration ? String(task.estimatedDuration / 60) : '',
      tags: task.tags.join(', '),
    })
    setDialogOpen(true)
  }

  const handleDelete = async (task: Task) => {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    await db.tasks.delete(task.id)
    loadData()
  }

  const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
    await db.tasks.update(task.id, { status: newStatus, updatedAt: now() })
    loadData()
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

  const isOverdue = (task: Task) => task.dueDate && task.status !== 'done' && task.dueDate < Date.now()

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
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage your study tasks and assignments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingTask(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
              <DialogDescription>
                {editingTask ? 'Update your task details' : 'Create a new task to track your work'}
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
                    placeholder="e.g., Complete calculus problem set"
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
                    placeholder="Add details..."
                    rows={3}
                    maxLength={1000}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="subjectId">Subject</Label>
                    <Select value={formData.subjectId} onValueChange={(value) => setFormData({ ...formData, subjectId: value })}>
                      <SelectTrigger id="subjectId">
                        <SelectValue placeholder="Select subject (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Task['status'] })}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}>
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <span className="flex items-center gap-2">
                              <span className={`h-3 w-3 rounded-full ${priority.color}`} aria-hidden="true" />
                              {priority.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Due Date (optional)</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
                    <Input
                      id="estimatedDuration"
                      type="number"
                      min="1"
                      value={formData.estimatedDuration}
                      onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                      placeholder="e.g., 60"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="homework, urgent, chapter-3"
                      maxLength={200}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingTask ? 'Save Changes' : 'Create Task'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {priorities.map((priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                <span className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${priority.color}`} aria-hidden="true" />
                  {priority.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-medium">No tasks yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first task to stay organized
            </p>
            <Button asChild className="mt-4">
              <Link to="?new=true">Add Task</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const subject = subjects.find(s => s.id === task.subjectId)
            const priority = priorities.find(p => p.value === task.priority)
            return (
              <Card key={task.id} className={cn(task.status === 'done' && 'opacity-60')}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="p-1.5 rounded" style={{ backgroundColor: priority?.color + '20' }}>
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: priority?.color }} aria-hidden="true" />
                        </div>
                        <h3 className={cn('font-semibold truncate', task.status === 'done' && 'line-through')}>{task.title}</h3>
                        <Badge variant="outline" className="text-xs capitalize">{task.status.replace('-', ' ')}</Badge>
                      </div>
                      {task.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {subject && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" aria-hidden="true" />
                            {subject.name}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className={cn('flex items-center gap-1', isOverdue(task) ? 'text-destructive' : '')}>
                            <Calendar className="h-3 w-3" aria-hidden="true" />
                            {formatDate(task.dueDate)}
                            {isOverdue(task) && ' (Overdue)'}
                          </span>
                        )}
                        {task.estimatedDuration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {formatDuration(task.estimatedDuration)}
                          </span>
                        )}
                        {task.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            {task.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                            {task.tags.length > 3 && <Badge variant="outline" className="text-xs">+{task.tags.length - 3}</Badge>}
                          </span>
                        )}
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
                        <DropdownMenuItem onClick={() => handleEdit(task)}>
                          <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                        {statuses.filter(s => s.value !== task.status).map((status) => (
                          <DropdownMenuItem key={status.value} onClick={() => handleStatusChange(task, status.value as Task['status'])}>
                            {status.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(task)}
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
            )
          })}
        </div>
      )}
    </div>
  )
}