/** Градиенты для кастомных категорий — используют CSS переменные для поддержки тем */
export const CATEGORY_GRADIENTS = [
  { key: 'gray',    gradient: 'var(--gradient-gray)'    },
  { key: 'coral',   gradient: 'var(--gradient-coral)'   },
  { key: 'rose',    gradient: 'var(--gradient-rose)'    },
  { key: 'ocean',   gradient: 'var(--gradient-ocean)'   },
  { key: 'sage',    gradient: 'var(--gradient-sage)'    },
  { key: 'purple',  gradient: 'var(--gradient-purple)'  },
  { key: 'amber',   gradient: 'var(--gradient-amber)'   },
  { key: 'teal',    gradient: 'var(--gradient-teal)'    },
  { key: 'crimson', gradient: 'var(--gradient-crimson)' },
  { key: 'indigo',  gradient: 'var(--gradient-indigo)'  },
  { key: 'olive',   gradient: 'var(--gradient-olive)'   },
  { key: 'brown',   gradient: 'var(--gradient-brown)'   },
  { key: 'pink',    gradient: 'var(--gradient-pink)'    },
  { key: 'mint',    gradient: 'var(--gradient-mint)'    },
  { key: 'slate',   gradient: 'var(--gradient-slate)'   },
  { key: 'gold',    gradient: 'var(--gradient-gold)'    },
]

export const DEFAULT_CATEGORY_GRADIENT = 'var(--gradient-gray)'

export interface ParsedCategoryIcon {
  gradient: string
  emoji: string
  likesLabel: string
  dislikesLabel: string
}

/**
 * Разбирает поле icon кастомной категории.
 *
 * Поддерживаемые форматы:
 *   'coral:📚'                     → { gradient, emoji: '📚', likesLabel: '', dislikesLabel: '' }
 *   'coral:📚|Обожает|Не нравится' → { gradient, emoji: '📚', likesLabel: 'Обожает', dislikesLabel: 'Не нравится' }
 *   '📚'                           → { DEFAULT_GRADIENT, emoji: '📚', likesLabel: '', dislikesLabel: '' }
 */
export function parseCategoryIconField(raw: string | null): ParsedCategoryIcon {
  if (!raw) return { gradient: DEFAULT_CATEGORY_GRADIENT, emoji: '📋', likesLabel: '', dislikesLabel: '' }

  // Разделяем иконку и лейблы по первому |
  const pipeIdx = raw.indexOf('|')
  const iconPart = pipeIdx > 0 ? raw.slice(0, pipeIdx) : raw
  const labelsPart = pipeIdx > 0 ? raw.slice(pipeIdx + 1) : ''
  const labelParts = labelsPart.split('|')
  const likesLabel = labelParts[0] ?? ''
  const dislikesLabel = labelParts[1] ?? ''

  // Разбираем цветовой ключ из части иконки
  const colonIdx = iconPart.indexOf(':')
  if (colonIdx > 0 && colonIdx <= 8) {
    const key = iconPart.slice(0, colonIdx)
    const found = CATEGORY_GRADIENTS.find((g) => g.key === key)
    if (found) {
      return { gradient: found.gradient, emoji: iconPart.slice(colonIdx + 1), likesLabel, dislikesLabel }
    }
  }

  return { gradient: DEFAULT_CATEGORY_GRADIENT, emoji: iconPart, likesLabel, dislikesLabel }
}

/**
 * Собирает поле icon из компонентов.
 * Если лейблы пусты — возвращает 'colorKey:emoji' (или просто 'emoji' для gray).
 * Если есть лейблы — 'colorKey:emoji|likesLabel|dislikesLabel'.
 */
export function buildCategoryIconField(
  colorKey: string,
  emoji: string,
  likesLabel?: string,
  dislikesLabel?: string,
): string {
  const iconPart = colorKey === 'gray' ? emoji : `${colorKey}:${emoji}`
  const likes = likesLabel?.trim() ?? ''
  const dislikes = dislikesLabel?.trim() ?? ''
  if (!likes && !dislikes) return iconPart
  return `${iconPart}|${likes}|${dislikes}`
}
