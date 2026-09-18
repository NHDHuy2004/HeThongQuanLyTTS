'use client'

import { useSyncExternalStore } from 'react'
import { Moon } from '@phosphor-icons/react/dist/ssr/Moon'
import { Sun } from '@phosphor-icons/react/dist/ssr/Sun'
import { cn } from '@/lib/utils'

const THEME_KEY = 'theme'

function subscribe(callback: () => void): () => void {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

function getSnapshot(): string {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function getServerSnapshot(): string {
  return 'light'
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const isDark = theme === 'dark'

  function handleToggle() {
    const next = isDark ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // localStorage unavailable (private mode) - theme still applies this session
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={isDark}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-3.5 text-left',
        'transition-colors active:bg-muted/60',
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {isDark ? (
          <Moon className="size-4" weight="bold" />
        ) : (
          <Sun className="size-4" weight="bold" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Chế độ tối</p>
        <p className="text-xs text-muted-foreground">
          {isDark ? 'Đang bật' : 'Đang tắt'}
        </p>
      </div>
      <span
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full transition-colors',
          isDark ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-5 rounded-full bg-card shadow-sm transition-transform',
            isDark && 'translate-x-4',
          )}
        />
      </span>
    </button>
  )
}