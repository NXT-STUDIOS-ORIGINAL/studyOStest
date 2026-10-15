import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, BookOpen, Edit, Trash2, Archive, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react'
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
import { subjectSchema, createSubjectSchema, updateSubjectSchema } from '../validation/schemas'
import type { Subject } from '../types'
import { cn } from '../lib/utils'

const defaultColors = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#6366f1', '#d946ef', '#f43f5e', '#fb923c', '#a3e635',
]

const defaultIcons = [
  'book-open', 'calculator', 'code', 'atom', 'globe',
  'music', 'paintbrush', 'flask-conical', 'history', 'languages',
  'brain', 'microscope', 'trophy', 'graduation-cap', 'library',
]

export function Subjects() {
  const { profile } = useProfile()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: defaultColors[0],
    icon: defaultIcons[0],
    description: '',
  })

  useEffect(() => {
    loadSubjects()
  }, [profile, showArchived])

  const loadSubjects = async () => {
    if (!profile) return
    setLoading(true)
    const data = await db.subjects
      .where('profileId')
      .equals(profile.id)
      .filter(s => showArchived || !s.archived)
      .sortBy('name')
    setSubjects(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      if (editingSubject) {
        const validated = updateSubjectSchema.parse({
          ...formData,
          id: editingSubject.id,
          profileId: profile.id,
          updatedAt: now(),
        })
        await db.subjects.put(validated)
      } else {
        const validated = createSubjectSchema.parse({
          ...formData,
          id: generateId(),
          profileId: profile.id,
          archived: false,
          createdAt: now(),
          updatedAt: now(),
        })
        await db.subjects.add(validated)
      }
      setDialogOpen(false)
      setEditingSubject(null)
      resetForm()
      loadSubjects()
    } catch (error) {
      console.error('Failed to save subject:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      color: defaultColors[Math.floor(Math.random() * defaultColors.length)],
      icon: defaultIcons[0],
      description: '',
    })
  }

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setFormData({
      name: subject.name,
      color: subject.color,
      icon: subject.icon || defaultIcons[0],
      description: subject.description || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`Delete "${subject.name}"? This cannot be undone.`)) return
    await db.subjects.delete(subject.id)
    loadSubjects()
  }

  const handleArchive = async (subject: Subject) => {
    await db.subjects.update(subject.id, { archived: !subject.archived, updatedAt: now() })
    loadSubjects()
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
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-1">Organize your study materials by subject</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingSubject(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSubject ? 'Edit Subject' : 'New Subject'}</DialogTitle>
              <DialogDescription>
                {editingSubject ? 'Update your subject details' : 'Create a new subject to organize your studies'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Mathematics"
                    required
                    maxLength={100}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {defaultColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={cn(
                          'h-8 w-8 rounded-full border-2 transition-all',
                          formData.color === color
                            ? 'border-primary scale-110'
                            : 'border-transparent hover:border-muted'
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={color}
                        aria-pressed={formData.color === color}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                    <SelectTrigger id="icon">
                      <SelectValue placeholder="Select icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultIcons.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          <span className="capitalize flex items-center gap-2">
                            <i className={`lucide lucide-${icon} h-4 w-4`} aria-hidden="true" />
                            {icon.replace('-', ' ')}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add a description..."
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingSubject ? 'Save Changes' : 'Create Subject'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant={showArchived ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </Button>
      </div>

      {subjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-medium">No subjects yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {showArchived ? 'No archived subjects' : 'Create your first subject to organize your studies'}
            </p>
            {!showArchived && (
              <Button asChild className="mt-4">
                <Link to="?new=true">Add Subject</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject.id} className="relative">
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: subject.color }} />
              <CardContent className="p-6 pt-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: subject.color + '20' }}
                      >
                        <i className={`lucide lucide-${subject.icon || 'book-open'} h-5 w-5`} style={{ color: subject.color }} aria-hidden="true" />
                      </div>
                      <h3 className="font-semibold truncate">{subject.name}</h3>
                    </div>
                    {subject.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{subject.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {subject.archived ? 'Archived' : 'Active'}
                      </Badge>
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
                      <DropdownMenuItem onClick={() => handleEdit(subject)}>
                        <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleArchive(subject)}
                        className={subject.archived ? 'text-primary' : ''}
                      >
                        <Archive className="mr-2 h-4 w-4" aria-hidden="true" />
                        {subject.archived ? 'Restore' : 'Archive'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(subject)}
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