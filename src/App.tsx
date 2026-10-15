import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { Settings } from './pages/Settings'
import { Subjects } from './pages/Subjects'
import { Goals } from './pages/Goals'
import { Tasks } from './pages/Tasks'
import { Notes } from './pages/Notes'
import { Flashcards } from './pages/Flashcards'
import { Timer } from './pages/Timer'
import { NotFound } from './pages/NotFound'
import { ErrorBoundary } from './components/ErrorBoundary'

function Layout() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/timer" element={<Timer />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <Layout />
    </ErrorBoundary>
  )
}