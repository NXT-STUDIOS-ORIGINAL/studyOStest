import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, FileText, Edit, Trash2, Archive, MoreHorizontal, Pin, FileSearch, Type } from 'lucide-react'
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
import { noteSchema, createNoteSchema, updateNoteSchema } from '../validation/schemas'
import type { Note, Subject, Task } from '../types'
import { cn, formatDate } from '../lib/utils'

const formats = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'plain', label: 'Plain Text' },
  { value: 'rich', label: 'Rich Text' },
] as const

export function Notes() {
  const { profile } = useProfile()
  const [notes, setNotes] = useState<Note[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filterArchived, setFilterArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subjectId: '',
    taskId: '',
    format: 'markdown' as Note['format'],
    tags: '',
    isPinned: false,
  })

  useEffect(() => {
    loadData()
  }, [profile, filterArchived])

  const loadData = async () => {
    if (!profile) return
    setLoading(true)
    const [notesData, subjectsData, tasksData] = await Promise.all([
      db.notes.where('profileId').equals(profile.id).filter(n => filterArchived || !n.archived).toArray(),
      db.subjects.where('profileId').equals(profile.id).filter(s => !s.archived).toArray(),
      db.tasks.where('profileId').equals(profile.id).filter(t => t.status !== 'done' && t.status !== 'archived').toArray(),
    ])
    
    notesData.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (b.isPinned && !a.isPinned) return 1
      return b.updatedAt - a.updatedAt
    })
    
    setNotes(notesData)
    setSubjects(subjectsData)
    setTasks(tasksData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean)

      if (editingNote) {
        const validated = updateNoteSchema.parse({
          ...formData,
          id: editingNote.id,
          profileId: profile.id,
          subjectId: formData.subjectId || undefined,
          taskId: formData.taskId || undefined,
          tags,
          updatedAt: now(),
        })
        await db.notes.put(validated)
      } else {
        const validated = createNoteSchema.parse({
          ...formData,
          id: generateId(),
          profileId: profile.id,
          subjectId: formData.subjectId || undefined,
          taskId: formData.taskId || undefined,
          tags,
          archived: false,
          createdAt: now(),
          updatedAt: now(),
        })
        await db.notes.add(validated)
      }
      setDialogOpen(false)
      setEditingNote(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      subjectId: '',
      taskId: '',
      format: 'markdown',
      tags: '',
      isPinned: false,
    })
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setFormData({
      title: note.title,
      content: note.content,
      subjectId: note.subjectId || '',
      taskId: note.taskId || '',
      format: note.format,
      tags: note.tags.join(', '),
      isPinned: note.isPinned,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (note: Note) => {
    if (!confirm(`Delete "${note.title}"? This cannot be undone.`)) return
    await db.notes.delete(note.id)
    loadData()
  }

  const handleArchive = async (note: Note) => {
    await db.notes.update(note.id, { archived: !note.archived, updatedAt: now() })
    loadData()
  }

  const handlePin = async (note: Note) => {
    await db.notes.update(note.id, { isPinned: !note.isPinned, updatedAt: now() })
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
          <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-muted-foreground mt-1">Capture and organize your study notes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingNote(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle>
              <DialogDescription>
                {editingNote ? 'Update your note' : 'Create a new note for your studies'}
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
                    placeholder="e.g., Calculus derivatives summary"
                    required
                    maxLength={200}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="subjectId">Subject (optional)</Label>
                    <Select value={formData.subjectId} onValueChange={(value) => setFormData({ ...formData, subjectId: value })}>
                      <SelectTrigger id="subjectId">
                        <SelectValue placeholder="Select subject" />
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
                    <Label htmlFor="taskId">Related Task (optional)</Label>
                    <Select value={formData.taskId} onValueChange={(value) => setFormData({ ...formData, taskId: value })}>
                      <SelectTrigger id="taskId">
                        <SelectValue placeholder="Select task" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {tasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="format">Format</Label>
                  <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value as Note['format'] })}>
                    <SelectTrigger id="format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {formats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>{format.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="formulas, derivatives, chain-rule"
                    maxLength={200}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your note here... Markdown supported"
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="isPinned" className="cursor-pointer">Pin to top</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingNote ? 'Save Changes' : 'Create Note'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant={filterArchived ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterArchived(!filterArchived)}
        >
          {filterArchived ? 'Hide Archived' : 'Show Archived'}
        </Button>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-medium">No notes yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {filterArchived ? 'No archived notes' : 'Create your first note to start capturing knowledge'}
            </p>
            {!filterArchived && (
              <Button asChild className="mt-4">
                <Link to="?new=true">New Note</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const subject = subjects.find(s => s.id === note.subjectId)
            const task = tasks.find(t => t.id === note.taskId)
            return (
              <Card key={note.id} className={cn(note.isPinned && 'border-primary/50', note.archived && 'opacity-60')}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {note.isPinned && <Pin className="h-4 w-4 text-yellow-500" aria-hidden="true" />}
                        <h3 className={cn('font-semibold truncate', note.archived && 'line-through')}>{note.title}</h3>
                        <Badge variant="outline" className="text-xs capitalize">{note.format}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2 font-mono">{note.content}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {subject && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" aria-hidden="true" />
                            {subject.name}
                          </span>
                        )}
                        {task && (
                          <span className="flex items-center gap-1">
                            <CheckSquare className="h-3 w-3" aria-hidden="true" />
                            {task.title}
                          </span>
                        )}
                        {note.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            {note.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                            {note.tags.length > 3 && <Badge variant="outline" className="text-xs">+{note.tags.length - 3}</Badge>}
                          </span>
                        )}
                        <span className="text-xs">Updated: {formatDate(note.updatedAt)}</span>
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
                        <DropdownMenuItem onClick={() => handleEdit(note)}>
                          <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePin(note)}>
                          {note.isPinned ? <Pin className="mr-2 h-4 w-4 text-yellow-500" /> : <Pin className="mr-2 h-4 w-4" />}
                          {note.isPinned ? 'Unpin' : 'Pin to Top'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleArchive(note)}
                          className={note.archived ? 'text-primary' : ''}
                        >
                          <Archive className="mr-2 h-4 w-4" aria-hidden="true" />
                          {note.archived ? 'Restore' : 'Archive'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(note)}
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

import { BookOpen, CheckSquare } from 'lucide-react'