'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle'
import { XCircle } from '@phosphor-icons/react/dist/ssr/XCircle'
import { X } from '@phosphor-icons/react/dist/ssr/X'

type ToastType = 'success' | 'error'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timers = timersRef.current
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId
    setToasts((prev) => [...prev, { id, message, type }])
    const timer = setTimeout(() => removeToast(id), 4000)
    timersRef.current.set(id, timer)
  }, [removeToast])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-card animate-in slide-in-from-bottom-4 fade-in duration-200 ${
              t.type === 'success'
                ? 'border-success/30 bg-success/10 text-success dark:border-success/40 dark:bg-success/15'
                : 'border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/15'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle className="size-4 shrink-0" weight="bold" />
            ) : (
              <XCircle className="size-4 shrink-0" weight="bold" />
            )}
            <span className="max-w-72">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-1 rounded-sm p-0.5 opacity-60 hover:opacity-100"
              aria-label="Đóng"
            >
              <X className="size-3.5" weight="bold" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}