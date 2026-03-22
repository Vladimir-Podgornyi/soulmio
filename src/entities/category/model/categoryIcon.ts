/** Градиенты для кастомных категорий */
export const CATEGORY_GRADIENTS = [
  { key: 'gray',    gradient: 'linear-gradient(145deg, #2A2826, #3A3630)' },
  { key: 'coral',   gradient: 'linear-gradient(145deg, #7A3020, #B04228)' },
  { key: 'rose',    gradient: 'linear-gradient(145deg, #5C2240, #904060)' },
  { key: 'ocean',   gradient: 'linear-gradient(145deg, #182E48, #285078)' },
  { key: 'sage',    gradient: 'linear-gradient(145deg, #22382A, #345A40)' },
  { key: 'purple',  gradient: 'linear-gradient(145deg, #2A2230, #483060)' },
  { key: 'amber',   gradient: 'linear-gradient(145deg, #3A2A10, #5A4010)' },
  { key: 'teal',    gradient: 'linear-gradient(145deg, #1A3038, #205048)' },
  { key: 'crimson', gradient: 'linear-gradient(145deg, #5A1020, #8A2030)' },
  { key: 'indigo',  gradient: 'linear-gradient(145deg, #1A1A48, #283080)' },
  { key: 'olive',   gradient: 'linear-gradient(145deg, #2A3010, #405018)' },
  { key: 'brown',   gradient: 'linear-gradient(145deg, #3A2010, #5A3018)' },
  { key: 'pink',    gradient: 'linear-gradient(145deg, #4A1A3A, #703060)' },
  { key: 'mint',    gradient: 'linear-gradient(145deg, #183028, #285840)' },
  { key: 'slate',   gradient: 'linear-gradient(145deg, #1A2030, #283848)' },
  { key: 'gold',    gradient: 'linear-gradient(145deg, #3A3010, #605010)' },
]

export const DEFAULT_CATEGORY_GRADIENT = CATEGORY_GRADIENTS[0].gradient

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
