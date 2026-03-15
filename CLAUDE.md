# CLAUDE.md — Project Context

> This file is read by Claude Code at the start of every session.
> Do NOT delete or rename this file.

---

## 🧠 Project Overview

**Product name:** Soulmio
**Domain:** soulmio.app
**Tagline:** Remember what matters to the people you love.

A personal relationship memory app — users add people close to them (partner, friends, family) and track their preferences, tastes, and wishes across categories like food, restaurants, gifts, movies, and travel.

**Core value:** Never forget what your loved ones like or dislike. Get AI-powered suggestions based on their taste profile.

**Status:** MVP in development
**Target:** Web (Next.js) → Mobile (React Native / Expo) later

---

## 🌍 Internationalization

The app supports **3 languages**:
- 🇬🇧 English (default)
- 🇩🇪 German
- 🇷🇺 Russian

Use `next-intl` for i18n. All UI strings must go through the translation system — no hardcoded text in components. Translation files live in `/messages/{en,de,ru}.json`.

---

## 🏗️ Architecture — Feature-Sliced Design (FSD)

```
src/
├── app/                  # Next.js app router pages & layouts
│   ├── (auth)/           # Auth pages group
│   ├── (dashboard)/      # Main app pages group
│   └── api/              # API routes (Next.js)
│
├── pages/                # FSD pages layer (page-level components)
├── widgets/              # FSD widgets layer (composite UI blocks)
├── features/             # FSD features layer (user interactions)
├── entities/             # FSD entities layer (business objects)
│   ├── person/           # Person/Partner entity
│   ├── category/         # Category entity (food, restaurants, etc.)
│   ├── item/             # Item entity (dish, gift, movie, etc.)
│   └── user/             # Current user entity
│
└── shared/               # FSD shared layer
    ├── api/              # Supabase client & queries
    ├── config/           # App config, constants, env vars
    ├── i18n/             # i18n setup and utilities
    ├── lib/              # Utilities and helpers
    ├── types/            # Global TypeScript types
    └── ui/               # Shared UI components (Button, Input, Card, etc.)
```

### FSD Rules (STRICT)
- **Never** import from a higher layer into a lower layer
- `shared` has no imports from other FSD layers
- `entities` only imports from `shared`
- `features` imports from `entities` and `shared`
- `widgets` imports from `features`, `entities`, `shared`
- Business logic lives in `model/` folders, NOT in UI components
- UI components in each slice are dumb — they receive props, emit events

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v3 |
| UI Components | shadcn/ui |
| Forms | React Hook Form + Zod |
| State | Zustand (client state) |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (images) |
| AI | Anthropic Claude API (Haiku for recommendations) |
| i18n | next-intl |
| Payments | Stripe (later) |
| Deployment | Vercel |

---

## 🗄️ Database Schema (Supabase)

```sql
-- Users (managed by Supabase Auth)
-- auth.users is automatic

-- User profiles
profiles (
  id uuid references auth.users primary key,
  email text,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free', -- 'free' | 'pro'
  created_at timestamptz default now()
)

-- People (partners, friends, family)
people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  relation text, -- 'partner' | 'friend' | 'family' | 'other'
  avatar_url text,
  notes text,
  created_at timestamptz default now()
)

-- Categories (food, restaurants, gifts, movies, travel + custom)
categories (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id) on delete cascade,
  name text not null,           -- 'food', 'restaurants', 'gifts', etc.
  icon text,                    -- emoji or icon name
  is_custom boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
)

-- Items (dishes, restaurants, gifts, movies, places)
items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  person_id uuid references people(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  external_url text,            -- link to gift, restaurant, movie
  price numeric,                -- for gifts
  sentiment text,               -- 'likes' | 'dislikes' | 'wants' | 'visited'
  my_rating int,                -- 1-5, my personal rating (for restaurants)
  partner_rating int,           -- 1-5, partner's rating
  tags text[],
  ai_suggested boolean default false,
  created_at timestamptz default now()
)

-- AI Recommendations log
ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  person_id uuid references people(id),
  category_id uuid references categories(id),
  prompt_summary text,
  response text,
  created_at timestamptz default now()
)
```

**Row Level Security (RLS):** Always enabled. Users can only read/write their own data.

---

## 🎨 Design System

**Style:** Clean, modern, warm. Feels personal and intimate, not corporate.

**Colors (CSS variables):**
```css
--background: #FAFAF8
--foreground: #1A1A1A
--primary: #E8735A      /* warm coral */
--primary-foreground: #FFFFFF
--secondary: #F5F0EB    /* warm cream */
--muted: #E8E3DD
--accent: #4A90A4       /* muted teal for AI elements */
--border: #E2DDD8
```

**Typography:**
- Display: `Playfair Display` (headings, person names)
- Body: `DM Sans` (UI, labels, descriptions)

**Tone:** Warm, personal, slightly playful. Like a beautiful notebook.

---

## 📱 MVP Feature Scope

### ✅ MVP Includes:
1. Auth (email + Google OAuth via Supabase)
2. Add/edit/delete a person (partner, friend, family)
3. Default categories: Food, Restaurants, Gifts, Movies, Travel
4. Custom categories (user-created)
5. Add items with: title, description, image, sentiment (likes/dislikes/wants)
6. Restaurants: special view with "been there" + dual ratings (me + partner)
7. Gifts: URL link + price + image
8. AI recommendations (Claude Haiku) — suggest restaurants or gifts based on preferences
9. Multi-language (EN, DE, RU)

### ❌ NOT in MVP:
- Mobile app (React Native — Phase 2)
- Stripe payments (Phase 2)
- Sharing with partner (Phase 2)
- Push notifications (Phase 2)

---

## 💰 Free vs Pro Plan Limits

### Free Plan
| Feature | Limit |
|---|---|
| People (partners/friends/family) | **1 person only** |
| Default categories | Food, Restaurants, Gifts (3 of 5) |
| Custom categories | **2 max** |
| Items per category | Unlimited |
| Comments / notes on items | ✅ Allowed |
| AI Smart Cards | ❌ Not available |
| AI Chat | ❌ Not available |
| Photo uploads | ✅ Allowed |

### Pro Plan (~$5/month)
| Feature | Limit |
|---|---|
| People | **Unlimited** |
| Default categories | All 5 (Food, Restaurants, Gifts, Movies, Travel) |
| Custom categories | **Unlimited** |
| Items per category | Unlimited |
| Comments / notes on items | ✅ Allowed |
| AI Smart Cards (auto suggestions) | ✅ Unlimited |
| AI Chat | ✅ Unlimited |
| Photo uploads | ✅ Allowed |

### Implementation Notes
- Check subscription tier from `profiles.subscription_tier` ('free' | 'pro')
- Gate checks happen in feature hooks, NOT in UI components
- Always show a soft upgrade prompt when user hits a limit — never a hard error
- Upgrade prompt must be friendly and show exactly what they get with Pro
- Example gate check: `features/add-person/model/usePersonLimit.ts`

### Soft Paywall Message Examples
```
"You've added 1 person on the free plan.
 Upgrade to Pro to track preferences for friends and family too."

"Custom categories are limited to 2 on the free plan.
 Upgrade to Pro for unlimited categories."

"AI suggestions are a Pro feature.
 Upgrade to see personalized recommendations based on their taste."
```

---

## 🤖 AI Integration

**Model:** `claude-haiku-4-5` (fast + cheap)
**Where:** Next.js API route `/app/api/ai/recommend/route.ts`

---

### AI Mode: Contextual "Smart Cards" + Pro Chat

The AI works in two modes — automatic contextual suggestions (free + pro) and free-form chat (pro only).

**Do NOT show AI suggestions on every page load** — this wastes API budget and annoys users. Suggestions are triggered by user actions and cached.

---

### Mode 1 — Automatic Smart Cards (contextual triggers)

AI suggestions appear automatically as cards at the bottom of a list when specific thresholds are met. Generated once, cached in DB, refreshed only when new data is added.

**Trigger rules:**

| Trigger | Condition | Suggestion type |
|---|---|---|
| Restaurants list | 3+ restaurants added | "Places she might love" |
| Restaurant marked "disliked" | immediately | Alternative restaurant |
| Food list | 5+ dishes added | "Restaurants matching her taste" |
| Gifts list | 3+ gifts added | "More gift ideas in this range" |
| Movies list | 4+ movies added | "Similar movies she'd enjoy" |

**Flow:**
```
User adds new item
    ↓
Check: does this hit a trigger threshold?
    ↓
Yes → call Claude API → save to ai_recommendations (cached)
    ↓
Show Smart Card in UI with 2–3 suggestions
    ↓
Re-generate only when new items are added (not on every page load)
```

**Caching strategy:** Store generated suggestions in `ai_recommendations` table with a `is_stale` boolean. Mark stale when new items are added. Regenerate lazily on next page visit if stale.

---

### Mode 2 — Free-form AI Chat (Pro only)

Pro users can open an AI chat panel and ask anything about a person:
- "Where should we go for dinner this Friday?"
- "What gift should I get her for under €50?"
- "She liked X and Y restaurant — what do they have in common?"

Chat context always includes the full preference profile of the selected person.

---

### Rate Limits & Monetization

| | Free | Pro |
|---|---|---|
| Smart Card auto-suggestions | 3/month total | Unlimited |
| AI Chat | ❌ | ✅ Unlimited |
| Suggestion refresh | Manual, limited | Auto on new data |

When free user hits the limit: show a soft paywall card — "You've used your 3 free AI suggestions this month. Upgrade to Pro for unlimited suggestions and AI chat."

---

### API Route Structure

```
/app/api/ai/
├── recommend/route.ts     ← Smart Card generation (POST)
└── chat/route.ts          ← Free-form chat (POST, Pro only)
```

---

### Prompt Pattern

```
System: You are a personal advisor helping someone choose [category] 
        for their [relation]. Be specific, practical, and concise.
        Always respond in valid JSON only — no prose, no markdown.

User: Here is [Name]'s preference profile:
      - Likes: [list of liked items with context]
      - Dislikes: [list of disliked items]
      - Already visited/tried: [list with ratings 1-5]
      - Price range preference: [if available]
      
      Suggest exactly 3 [restaurants/gifts/movies] they would enjoy.
      For each suggestion include: title, reason (1 sentence), and 
      estimated_price if relevant.
      
      Respond in this JSON format:
      { "suggestions": [{ "title": "", "reason": "", "estimated_price": "" }] }
```

---

### Cost Control

- Always use `claude-haiku-4-5` — never Sonnet for automated suggestions
- Max input tokens per request: 1500
- Max output tokens: 400
- Cache aggressively — only regenerate when data changes
- Log all requests to `ai_recommendations` for cost monitoring

---

## 📋 Code Standards

### TypeScript
- Strict mode always on
- No `any` types — use `unknown` if needed
- Define types in `shared/types/` or co-located `model/types.ts`

### Components
- Functional components only
- Props interface defined above component
- No business logic in components — use custom hooks

### File naming
- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (prefix with `use`)
- Utils: `camelCase.ts`
- Types: `camelCase.ts`

### Imports order
1. React
2. Next.js
3. Third-party libraries
4. Internal FSD layers (top to bottom)
5. Relative imports

### Supabase
- Always use typed client: `createClient<Database>()`
- All queries in `shared/api/` or entity `api/` folders
- Never write raw Supabase queries inside components

### Error handling
- Use `Result` pattern or try/catch in API routes
- Show user-friendly error messages (translated)
- Log errors with context

### Testing Strategy (Pragmatic, not strict TDD)

**Rule: Test logic, not UI.**

UI components change too often during MVP — don't write tests for them.
Write tests for code that is critical, reusable, or easy to break silently.

**What to test (always):**
- Business logic hooks (`features/*/model/`)
- Utility functions (`shared/lib/`)
- API route handlers (`app/api/`)
- AI prompt builders and response parsers
- Zod validation schemas

**What NOT to test during MVP:**
- React UI components (too volatile)
- Supabase queries (test after schema stabilizes)
- Page layouts and styles

**Testing tool:** Vitest (fast, works natively with Next.js + TypeScript)

**When to write tests:**
- For utils and hooks: write test right after the function is done
- For API routes: write test before marking feature as complete
- For AI logic: always test with mocked responses

**File location:** Co-located with the code
```
features/
  add-restaurant/
    model/
      useAddRestaurant.ts
      useAddRestaurant.test.ts   ← right next to the hook
shared/
  lib/
    formatPrice.ts
    formatPrice.test.ts
```

**Minimum test per function:**
1. Happy path (works correctly)
2. Edge case (empty input, null, 0)
3. Error case (invalid data, API failure)

**Example:**
```ts
// formatPrice.test.ts
describe('formatPrice', () => {
  it('formats price with currency', () => {
    expect(formatPrice(49.99, 'EUR')).toBe('€49.99')
  })
  it('returns free label when price is 0', () => {
    expect(formatPrice(0, 'EUR')).toBe('Free')
  })
  it('handles null gracefully', () => {
    expect(formatPrice(null, 'EUR')).toBe('—')
  })
})
```

---

## 🔐 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 🚀 Development Workflow

**One session = one feature = one PR**

Before starting a feature:
1. Read this file
2. Understand which FSD layer the feature belongs to
3. Check existing shared components before creating new ones
4. Plan DB changes before writing UI

**Commands:**
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # TypeScript check
npm run lint         # ESLint
```

---

## 📁 Key Files Reference

```
CLAUDE.md                          ← YOU ARE HERE
src/shared/api/supabase.ts         ← Supabase client
src/shared/types/database.ts       ← Generated DB types
src/shared/ui/                     ← Reusable UI components
messages/en.json                   ← English translations
messages/de.json                   ← German translations
messages/ru.json                   ← Russian translations
```

---

*Last updated: project kickoff*
*Stack decisions are final for MVP — don't suggest alternatives unless asked*
