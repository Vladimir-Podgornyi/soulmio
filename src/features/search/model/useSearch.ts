'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/shared/api/supabase'
import { searchAll } from '../api'
import type { SearchResult } from '../api'

export function useSearch(userId: string | null) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!query.trim() || !userId) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)

    timerRef.current = setTimeout(async () => {
      const data = await searchAll(supabase, userId, query)
      setResults(data)
      setLoading(false)
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, userId])

  function reset() {
    setQuery('')
    setResults([])
    setLoading(false)
  }

  return { query, setQuery, results, loading, reset }
}
