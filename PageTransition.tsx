/**
 * PageTransition.tsx
 * Размести в: src/shared/ui/PageTransition.tsx
 *
 * Обёртка для плавных переходов между страницами в Next.js App Router.
 * Использует framer-motion (или CSS-only fallback).
 *
 * Использование:
 *   // В src/app/(dashboard)/layout.tsx:
 *   import { PageTransition } from '@/shared/ui/PageTransition'
 *   ...
 *   <PageTransition>{children}</PageTransition>
 */

'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

/**
 * CSS-only вариант (без framer-motion).
 * Перезапускает CSS-анимацию при смене pathname.
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
      style={{
        animation: 'pageEnter 0.3s cubic-bezier(0, 0, 0.2, 1) both',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Если хочешь использовать framer-motion (более богатые анимации):
 * npm install framer-motion
 *
 * import { motion, AnimatePresence } from 'framer-motion'
 *
 * const variants = {
 *   hidden:  { opacity: 0, y: 10 },
 *   enter:   { opacity: 1, y: 0 },
 *   exit:    { opacity: 0, y: -6 },
 * }
 *
 * export function PageTransitionMotion({ children }: { children: ReactNode }) {
 *   const pathname = usePathname()
 *   return (
 *     <AnimatePresence mode="wait">
 *       <motion.div
 *         key={pathname}
 *         variants={variants}
 *         initial="hidden"
 *         animate="enter"
 *         exit="exit"
 *         transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
 *       >
 *         {children}
 *       </motion.div>
 *     </AnimatePresence>
 *   )
 * }
 */
