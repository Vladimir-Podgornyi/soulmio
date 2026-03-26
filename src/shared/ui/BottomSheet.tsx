'use client'

/**
 * Shared BottomSheet / modal component.
 *
 * Mobile: slides up from bottom (bottom-sheet UX).
 * Desktop (sm+): centred dialog.
 *
 * Uses `dvh` (dynamic viewport height) so the sheet never overflows the
 * visible area when the virtual keyboard is open on iOS / Android.
 * The header is sticky — the title and close button are always visible.
 */

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  /** Extra class for the scrollable content area */
  contentClassName?: string
}

export function BottomSheet({ title, onClose, children, contentClassName }: BottomSheetProps) {
  // Prevent body scroll while sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] backdrop-animate" onClick={onClose} />

      {/* Sheet */}
      <div className="sheet-animate relative z-10 flex w-full max-w-md flex-col rounded-[28px] bg-bg-secondary max-h-[90dvh]">
        {/* Sticky header — always visible */}
        <div className="flex flex-shrink-0 items-center justify-between gap-3 px-6 pt-6 pb-5">
          <h2 className="min-w-0 flex-1 text-lg font-semibold tracking-[-0.5px] text-text-primary leading-snug">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-bg-input text-text-muted hover:bg-bg-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-14 ${contentClassName ?? ''}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
