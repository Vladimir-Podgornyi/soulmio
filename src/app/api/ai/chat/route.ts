import { NextRequest, NextResponse } from 'next/server'

// POST /api/ai/chat
// Свободный AI-чат — только для Pro-пользователей
// Контекст включает полный профиль предпочтений выбранного человека
export async function POST(_req: NextRequest) {
  // TODO: реализовать
  // 1. Аутентифицировать пользователя (сессия Supabase)
  // 2. Проверить уровень подписки — вернуть 403 если не Pro
  // 3. Загрузить полный профиль предпочтений человека
  // 4. Передать сообщение + контекст в Claude Haiku
  // 5. Вернуть ответ (потоком или целиком)

  return NextResponse.json({ message: 'Not implemented' }, { status: 501 })
}
