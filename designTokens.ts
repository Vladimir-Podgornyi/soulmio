/**
 * design-tokens.ts
 * Размести в: src/shared/config/designTokens.ts
 *
 * Единый источник правды для всех дизайн-токенов.
 * Используется в:
 *   - tailwind.config.ts (extend.colors, extend.borderRadius и т.д.)
 *   - React Native (Phase 2) — импортируется как JS-объект
 *   - CSS переменные генерируются автоматически
 *
 * ВАЖНО: Не использовать напрямую в компонентах.
 * В компонентах всегда через Tailwind классы или CSS var().
 */

export const colors = {
  // ── Акценты (одинаковые в обеих темах) ──────────────────
  primary:     '#E8735A',   // coral — кнопки, активные состояния, CTA
  primaryDark: '#C94F38',   // hover/pressed
  accentTeal:  '#4A90A4',   // teal — ТОЛЬКО для AI-элементов

  // ── Тёмная тема ─────────────────────────────────────────
  dark: {
    bgPrimary:    '#0E0C0A',   // ↑ теплее чем раньше (#100F0E)
    bgSecondary:  '#161310',
    bgCard:       '#1D1A17',
    bgInput:      '#2A2722',
    bgInputFocus: '#323029',
    bgHover:      '#242119',

    textPrimary:   '#EDE8E1',
    textSecondary: '#857A70',
    textMuted:     '#4E4438',

    border:     '#252220',
    borderCard: '#201E1B',

    primaryBg: '#2C1C16',   // active nav bg
    accentBg:  '#162C38',   // AI teal elements bg
  },

  // ── Светлая тема ─────────────────────────────────────────
  light: {
    bgPrimary:    '#FBF6F0',   // ↑ персиковее чем раньше (#FAF7F4)
    bgSecondary:  '#F2EBE2',
    bgCard:       '#EBE3D9',
    bgInput:      '#E2D8CC',
    bgInputFocus: '#D5CABD',
    bgHover:      '#E8DDD2',

    textPrimary:   '#2A1C10',
    textSecondary: '#70604F',
    textMuted:     '#A89480',

    border:     '#D8CEBC',
    borderCard: '#E5DDD0',

    primaryBg: '#FDECEA',
    accentBg:  '#E5F2F6',
  },

  // ── Gradient cards — тёмная тема ─────────────────────────
  gradients: {
    dark: {
      restaurants: ['#1F3828', '#2D5840'],
      gifts:       ['#5C1E3A', '#8C3055'],
      movies:      ['#162A40', '#224868'],
      food:        ['#6E2818', '#A03A22'],
      travel:      ['#2A1E40', '#402C60'],
    },
    light: {
      restaurants: ['#C8E8D2', '#A8D8B8'],
      gifts:       ['#F2CCDE', '#E8A8C8'],
      movies:      ['#C8E0F5', '#A8CCF0'],
      food:        ['#FAD8CE', '#F5BFAD'],
      travel:      ['#DDD0EE', '#C8B8E5'],
    },
  },

  // ── Sentiment colors ─────────────────────────────────────
  sentiment: {
    lovesBgDark:   '#1E3028',
    lovesTextDark: '#5CBD8A',
    lovesBgLight:  '#E6F5ED',
    lovesTextLight:'#2E7A4A',

    avoidBgDark:   '#3A1E1E',
    avoidTextDark: '#E06868',
    avoidBgLight:  '#FEE9E9',
    avoidTextLight:'#B83838',

    wantsBgDark:   '#2E2A18',
    wantsTextDark: '#F0A830',
    wantsBgLight:  '#FEF4E0',
    wantsTextLight:'#9A6A00',
  },
} as const

export const borderRadius = {
  card: '20px',
  item: '14px',
  pill: '20px',
  icon: '10px',
  btn:  '12px',
  tab:  '8px',
} as const

export const typography = {
  // Display / Names
  display: {
    fontWeight: '600',
    letterSpacing: '-0.5px',
  },
  // Card counts
  stat: {
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '-1px',
  },
  // Labels
  label: {
    fontSize: '11px',
    fontWeight: '500',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
} as const

// Easing functions — для playful вайба
export const easings = {
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  out:    'cubic-bezier(0, 0, 0.2, 1)',
} as const

// Durations
export const durations = {
  fast:   '120ms',
  normal: '200ms',
  slow:   '300ms',
  modal:  '250ms',
} as const
