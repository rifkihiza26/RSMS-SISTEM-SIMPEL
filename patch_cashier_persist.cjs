const fs = require('fs')
let code = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8')

// 1. Tambah useEffect ke import
code = code.replace(
  `import { useState, useRef } from 'react'`,
  `import { useState, useRef, useEffect } from 'react'`
)

// 2. Ganti inisialisasi sessions + activeSessionId dengan localStorage
code = code.replace(
  `  // Multi-session state
  const [sessions, setSessions] = useState<CartSession[]>([newSession(1)])
  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0].id)`,
  `  // Multi-session state - persisted to localStorage
  const STORAGE_KEY = 'rsms_cashier_sessions'
  const ACTIVE_KEY = 'rsms_cashier_active'

  const [sessions, setSessions] = useState<CartSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as CartSession[]
        // Filter out completed sessions on reload
        const pending = parsed.filter(s => !s.completed)
        if (pending.length > 0) return pending
      }
    } catch {}
    const first = newSession(1)
    return [first]
  })

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const activeId = localStorage.getItem(ACTIVE_KEY)
      if (saved && activeId) {
        const parsed = JSON.parse(saved) as CartSession[]
        const pending = parsed.filter(s => !s.completed)
        if (pending.find(s => s.id === activeId)) return activeId
        if (pending.length > 0) return pending[0].id
      }
    } catch {}
    return ''
  })

  // Auto-save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      // Only persist non-completed sessions
      const toSave = sessions.map(s => s.completed ? { ...s, completed: null } : s)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
      localStorage.setItem(ACTIVE_KEY, activeSessionId)
    } catch {}
  }, [sessions, activeSessionId])`
)

fs.writeFileSync('src/features/cashier/Cashier.tsx', code)
console.log('Persistence patched!')
