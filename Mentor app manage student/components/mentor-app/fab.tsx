'use client'

import { Plus } from '@phosphor-icons/react/dist/ssr/Plus'
import { cn } from '@/lib/utils'

interface FabProps {
  onClick?: () => void
  className?: string
}

export function Fab({ onClick, className }: FabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-24 right-4 z-40',
        'flex size-14 items-center justify-center rounded-full',
        'bg-primary text-primary-foreground',
        'shadow-lg shadow-primary/25',
        'transition-all duration-150',
        'hover:scale-105 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50',
        'sm:right-[calc(50%-215px+16px)]',
        className,
      )}
      aria-label="Giao viec nhanh"
    >
      <Plus className="size-6" weight="bold" />
    </button>
  )
}
