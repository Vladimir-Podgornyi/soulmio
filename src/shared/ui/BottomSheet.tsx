'use client'

/**
 * Shared BottomSheet / modal component.
 *
 * Centered on all screen sizes (mobile + desktop).
 * Bottom padding accounts for the 64px bottom nav bar on mobile.
 * Uses createPortal to avoid z-index stacking context issues.
 */

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface BottomSheetProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  /** Extra class for the scrollable content area */
  contentClassName?: string
}

export function BottomSheet({ title, onClose, children, contentClassName }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Блокируем скролл страницы пока шит открыт
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-[80px] md:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] backdrop-animate" onClick={onClose} />

      {/* Sheet */}
      <div className="sheet-animate relative z-10 flex w-full max-w-md flex-col rounded-[28px] bg-bg-secondary max-h-[calc(100dvh-96px)] md:max-h-[85dvh]">
        {/* Sticky header — always visible */}
        <div className="flex flex-shrink-0 items-center justify-between gap-3 px-6 pt-6 pb-5">
          <h2 className="min-w-0 flex-1 text-lg font-semibold tracking-[-0.5px] text-text-primary leading-snug">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-bg-input text-primary hover:bg-primary/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 ${contentClassName ?? ''}`}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
