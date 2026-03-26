import { NextRequest, NextResponse } from 'next/server'

// POST /api/ai/recommend
// Генерирует предложения AI Smart Card на основе профиля предпочтений человека
// Срабатывает при достижении пороговых значений элементов (см. CLAUDE.md → AI Integration)
export async function POST(_req: NextRequest) {
  // TODO: реализовать
  // 1. Аутентифицировать пользователя (сессия Supabase)
  // 2. Проверить уровень подписки и лимит использования за месяц
  // 3. Загрузить элементы человека для данной категории
  // 4. Сформировать промпт из профиля предпочтений
  // 5. Вызвать Claude Haiku (claude-haiku-4-5), макс. 1500 входных / 400 выходных токенов
  // 6. Сохранить ответ в таблицу ai_recommendations
  // 7. Вернуть JSON с предложениями

  return NextResponse.json({ message: 'Not implemented' }, { status: 501 })
}
