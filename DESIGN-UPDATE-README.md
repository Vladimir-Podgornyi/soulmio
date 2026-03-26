# SoulMio — Design Update Guide
> Март 2026 — playful + premium upgrade

## Что изменилось и зачем

### 1. Цвета

| Токен | Было | Стало | Почему |
|---|---|---|---|
| `--bg-primary` dark | `#100F0E` | `#0E0C0A` | Коричневый подтон — теплее, "живее" |
| `--bg-secondary` dark | `#171614` | `#161310` | Согласованный тёплый сдвиг |
| `--bg-primary` light | `#FAF7F4` | `#FBF6F0` | Персиковее, не "бумажный" |
| `--bg-secondary` light | `#F5F0EB` | `#F2EBE2` | Больше характера |
| gradient restaurants | `#1A3022→#285038` | `#1F3828→#2D5840` | +15% насыщенности |
| gradient gifts | `#501C38→#803050` | `#5C1E3A→#8C3055` | Насыщеннее, ярче |

### 2. Анимации (новые)

| Что | Класс/атрибут | Эффект |
|---|---|---|
| Переходы страниц | `main`, `.page-content` | fadeSlideIn 0.3s |
| Открытие модала | `[role="dialog"]` | scale + fade, bounce easing |
| Item cards hover | `.item-card` | translateX(4px) |
| Stat cards hover | `.stat-card` | translateY(-3px) + scale(1.01) |
| FAB button | `.fab` | scale(1.08) + rotate(3deg) |
| Добавить в избранное | `.favourite-btn.active` | heartPop keyframe |
| Person cards hover | `.person-card` | translateY(-2px) |
| Аватар при hover | `.person-card:hover .avatar-img` | wiggle animation |
| Список карточек | `.stagger-list > *` | появляют по очереди 40ms |
| Нотификации | `.notification-banner` | slideDown с bounce |
| Скелетон загрузки | `.skeleton` | shimmer shimmer |

---

## Инструкция по применению

### Шаг 1 — Обновить globals.css

```bash
# Сделай бэкап
cp src/app/globals.css src/app/globals.css.bak

# Скопируй новый файл
cp globals-design-update.css src/app/globals.css
```

> ⚠️ Если у тебя уже есть кастомные стили в globals.css —
> мержи вручную. Новый файл содержит полный набор токенов.

### Шаг 2 — Добавить PageTransition

```bash
cp PageTransition.tsx src/shared/ui/PageTransition.tsx
```

Затем в `src/app/(dashboard)/layout.tsx`:
```tsx
import { PageTransition } from '@/shared/ui/PageTransition'

export default function DashboardLayout({ children }) {
  return (
    <div>
      <Sidebar />
      <PageTransition>
        {children}
      </PageTransition>
    </div>
  )
}
```

### Шаг 3 — Добавить классы на существующие компоненты

#### Item cards (список элементов в категории)
```tsx
// В твоих item card компонентах добавь className
<div className="item-card ...существующие классы...">
```

#### Stat cards на дашборде
```tsx
<div className="stat-card ...существующие классы...">
```

#### Staggered lists (опционально — для wow-эффекта)
```tsx
// Обёртка вокруг списка карточек
<div className="stagger-list">
  {items.map(item => <ItemCard key={item.id} {...item} />)}
</div>
```

#### Favourite кнопка
```tsx
<button
  className={`favourite-btn ${isFavorite ? 'active' : ''}`}
  onClick={toggleFavorite}
>
  ⭐
</button>
```

#### Notification banners на дашборде
```tsx
<div className="notification-banner">
  {/* milestone, birthday, reminder */}
</div>
```

При dismiss добавляй класс `dismissing` перед удалением:
```tsx
const dismiss = () => {
  el.classList.add('dismissing')
  setTimeout(() => remove(), 250)
}
```

### Шаг 4 — Обновить designTokens.ts (опционально)

```bash
cp designTokens.ts src/shared/config/designTokens.ts
```

Это нужно для будущей React Native версии — токены уже в JS.

---

## Что НЕ трогали (намеренно)

- ✅ `--primary: #E8735A` — coral остался, он работает
- ✅ `--accent-teal: #4A90A4` — teal для AI остался
- ✅ Типографика — font weights, letter-spacing
- ✅ Border radius токены
- ✅ Sentiment colors (likes/dislikes/wants)
- ✅ shadcn/ui компоненты — только добавили transitions поверх

---

## Тест после применения

```bash
npm run dev
```

Проверь:
- [ ] Тёмный фон выглядит теплее (менее "угольный")
- [ ] Светлая тема — более персиковая, живая
- [ ] Модалы открываются с анимацией (scale + fade)
- [ ] Карточки на дашборде поднимаются при hover
- [ ] Item cards уходят вправо при hover
- [ ] FAB кнопка слегка поворачивается при hover
- [ ] Страницы плавно появляются при навигации
- [ ] При prefers-reduced-motion — всё статично (accessibility)
