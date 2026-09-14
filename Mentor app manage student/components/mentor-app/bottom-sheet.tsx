'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

/**
 * Draggable bottom sheet. Pull down (offset > 100px or fast velocity) to dismiss.
 * Content scrolls internally, capped at 85dvh.
 */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[90] mx-auto max-w-[430px] rounded-t-2xl border-t border-border bg-card shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.45 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose()
            }}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? 'Bottom sheet'}
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="h-1.5 w-11 rounded-full bg-border" />
            </div>
            {title && (
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-center text-base font-semibold tracking-tight">{title}</h2>
              </div>
            )}
            <div className="max-h-[calc(85dvh-56px)] overflow-y-auto scrollbar-none">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}