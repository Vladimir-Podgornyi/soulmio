'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

/**
 * Обёртка для плавных переходов между страницами в Next.js App Router.
 * Перезапускает CSS-анимацию pageEnter при смене pathname.
 */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Перезапустить анимацию
    el.style.animation = 'none'
    // Форсировать reflow
    void el.offsetHeight
    el.style.animation = ''
  }, [pathname])

  return (
    <div
      ref={containerRef}
      className={`page-transition ${className}`}
    >
      {children}
    </div>
  )
}
