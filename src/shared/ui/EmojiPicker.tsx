'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'

export const EMOJI_DATA: Array<{ e: string; k: string }> = [
  // Популярные
  { e: '📚', k: 'книги учёба чтение books reading study' },
  { e: '🎵', k: 'музыка music song' },
  { e: '🏃', k: 'бег спорт run sport fitness' },
  { e: '💪', k: 'тренировка спорт fitness gym workout' },
  { e: '🎮', k: 'игры games gaming' },
  { e: '🌿', k: 'природа растения nature plants green' },
  { e: '🐾', k: 'животные питомцы pets animals' },
  { e: '✈️', k: 'путешествия travel fly flight' },
  { e: '🛍️', k: 'шоппинг покупки shopping' },
  { e: '🎨', k: 'искусство арт art creative рисование' },
  { e: '🧘', k: 'медитация йога yoga meditation wellness' },
  { e: '💅', k: 'красота beauty nails маникюр' },
  // Еда и напитки
  { e: '🍕', k: 'пицца pizza food еда' },
  { e: '🍣', k: 'суши sushi японская еда' },
  { e: '🍺', k: 'пиво beer drink напитки' },
  { e: '☕', k: 'кофе coffee чай tea' },
  { e: '🍷', k: 'вино wine drink' },
  { e: '🍔', k: 'бургер burger fast food' },
  { e: '🍜', k: 'рамен лапша ramen noodles' },
  { e: '🎂', k: 'торт cake birthday день рождения' },
  { e: '🍩', k: 'пончик donut sweet' },
  { e: '🥗', k: 'салат salad healthy здоровье' },
  { e: '🍰', k: 'пирожное dessert cake sweet' },
  { e: '🧃', k: 'сок juice drink' },
  { e: '🥤', k: 'коктейль cocktail drink smoothie' },
  { e: '🍫', k: 'шоколад chocolate sweet десерт' },
  { e: '🍿', k: 'попкорн popcorn cinema movies' },
  { e: '🍳', k: 'готовка cooking kitchen кухня яйца' },
  { e: '🥩', k: 'мясо meat стейк steak bbq' },
  // Развлечения и хобби
  { e: '🎬', k: 'кино фильмы cinema movies film' },
  { e: '🎭', k: 'театр theatre drama' },
  { e: '🎯', k: 'цель target goal дартс darts' },
  { e: '🎲', k: 'настолки board games dice кости' },
  { e: '🧩', k: 'пазл puzzle games головоломка' },
  { e: '♟️', k: 'шахматы chess strategy' },
  { e: '🎸', k: 'гитара guitar music музыка' },
  { e: '🎹', k: 'пианино piano keyboard music' },
  { e: '🎤', k: 'пение singing karaoke вокал' },
  { e: '🎻', k: 'скрипка violin music' },
  { e: '🥁', k: 'барабаны drums music' },
  { e: '📷', k: 'фото фотография photo photography camera' },
  { e: '✏️', k: 'рисование drawing writing письмо' },
  { e: '📖', k: 'чтение reading book книга' },
  { e: '🖌️', k: 'живопись painting art творчество' },
  { e: '🧵', k: 'шитьё knitting craft рукоделие' },
  { e: '🧶', k: 'вязание knitting craft хобби' },
  // Спорт
  { e: '⚽', k: 'футбол soccer football sport' },
  { e: '🏀', k: 'баскетбол basketball sport' },
  { e: '🎾', k: 'теннис tennis sport' },
  { e: '🏊', k: 'плавание swimming swim sport' },
  { e: '🚴', k: 'велосипед cycling bike sport' },
  { e: '🧗', k: 'скалолазание climbing sport' },
  { e: '⛷️', k: 'лыжи skiing ski sport winter' },
  { e: '🏄', k: 'сёрфинг surfing sport море' },
  { e: '🥊', k: 'бокс boxing sport martial arts' },
  { e: '🏋️', k: 'тренажёрный зал weightlifting gym sport' },
  { e: '🤸', k: 'гимнастика gymnastics sport' },
  { e: '🏇', k: 'верховая езда horse riding equestrian' },
  { e: '🏒', k: 'хоккей hockey sport ice' },
  { e: '🏈', k: 'американский футбол american football sport' },
  { e: '⛳', k: 'гольф golf sport' },
  { e: '🎿', k: 'лыжи ski winter sport' },
  // Природа и путешествия
  { e: '🏔️', k: 'горы mountains travel nature' },
  { e: '🏖️', k: 'пляж beach travel sea море' },
  { e: '🌊', k: 'море волны sea ocean waves' },
  { e: '🌅', k: 'закат рассвет sunset sunrise' },
  { e: '🌲', k: 'лес деревья forest trees nature' },
  { e: '🌸', k: 'цветы flowers spring весна' },
  { e: '🦋', k: 'бабочка butterfly nature' },
  { e: '🌍', k: 'мир world global earth путешествия travel' },
  { e: '🗺️', k: 'карта map travel путешествия' },
  { e: '⛺', k: 'кемпинг camping nature туризм' },
  { e: '🌄', k: 'горный пейзаж mountain landscape nature' },
  { e: '🏕️', k: 'кемпинг camp outdoor природа' },
  { e: '🌺', k: 'цветок flower tropical nature' },
  { e: '🍀', k: 'клевер clover luck природа' },
  { e: '🌻', k: 'подсолнух sunflower flower' },
  // Животные
  { e: '🐕', k: 'собака dog pet питомец' },
  { e: '🐈', k: 'кошка cat pet питомец' },
  { e: '🐇', k: 'кролик rabbit pet' },
  { e: '🐠', k: 'рыбка fish aquarium' },
  { e: '🐦', k: 'птица bird nature' },
  { e: '🐢', k: 'черепаха turtle reptile pet' },
  { e: '🦜', k: 'попугай parrot bird pet' },
  { e: '🐹', k: 'хомяк hamster rodent pet' },
  // Работа и учёба
  { e: '💻', k: 'компьютер computer work работа it' },
  { e: '📊', k: 'статистика charts work business аналитика' },
  { e: '🔬', k: 'наука science research лаборатория' },
  { e: '🏆', k: 'достижения awards trophy победа win' },
  { e: '💡', k: 'идеи ideas creative вдохновение' },
  { e: '🔧', k: 'инструменты tools DIY ремонт' },
  { e: '📝', k: 'заметки notes writing todo список' },
  { e: '🎓', k: 'образование education study graduation' },
  { e: '📐', k: 'математика math geometry design' },
  // Дом и быт
  { e: '🏠', k: 'дом home house' },
  { e: '🛋️', k: 'диван couch home relax отдых' },
  { e: '🌱', k: 'растения plants garden сад' },
  { e: '🧹', k: 'уборка cleaning home порядок' },
  { e: '🧁', k: 'выпечка baking sweet dessert' },
  { e: '🧺', k: 'стирка laundry home' },
  { e: '🪴', k: 'комнатные растения indoor plants' },
  // Красота и стиль
  { e: '💄', k: 'макияж makeup beauty красота' },
  { e: '👗', k: 'одежда fashion мода clothes' },
  { e: '👟', k: 'кроссовки shoes sneakers обувь' },
  { e: '💍', k: 'украшения jewelry accessories' },
  { e: '🛁', k: 'уход spa bath wellness релакс' },
  { e: '👒', k: 'шляпа hat fashion аксессуары' },
  { e: '👜', k: 'сумка bag fashion accessories' },
  // Разное
  { e: '❤️', k: 'любовь love heart сердце' },
  { e: '⭐', k: 'звезда star favorite избранное' },
  { e: '🔥', k: 'огонь fire hot популярное' },
  { e: '💰', k: 'деньги money finance финансы бюджет' },
  { e: '📱', k: 'телефон phone mobile смартфон' },
  { e: '🎁', k: 'подарок gift present' },
  { e: '🎉', k: 'праздник party celebration вечеринка' },
  { e: '🧠', k: 'мозг brain mind knowledge знания' },
  { e: '🌙', k: 'ночь night moon луна сон sleep' },
  { e: '☀️', k: 'солнце sun morning утро' },
  { e: '⚡', k: 'энергия energy lightning электричество' },
  { e: '🎪', k: 'цирк circus entertainment шоу' },
  { e: '🌈', k: 'радуга rainbow colorful яркий' },
  { e: '🏡', k: 'дом загородный house home дача' },
  { e: '🧳', k: 'чемодан suitcase travel поездка trip' },
  { e: '🚗', k: 'машина car auto drive поездка' },
  { e: '🚀', k: 'ракета rocket space космос' },
  { e: '🎠', k: 'карусель merry-go-round entertainment' },
  { e: '🎋', k: 'японская культура japan bamboo zen' },
  { e: '🕯️', k: 'свеча candle romantic уют cozy' },
  { e: '🧸', k: 'медведь teddy bear toy игрушка' },
  { e: '🎃', k: 'хэллоуин halloween autumn осень' },
  { e: '🎄', k: 'новый год christmas tree праздник' },
]

const EMOJI_COLS = 7
const EMOJI_ROWS_DEFAULT = 2

interface EmojiPickerProps {
  value: string
  onChange: (e: string) => void
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const t = useTranslations()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)

  const filtered = search.trim()
    ? EMOJI_DATA.filter((item) =>
        item.k.toLowerCase().includes(search.toLowerCase()) || item.e === search.trim()
      )
    : EMOJI_DATA

  const defaultCount = EMOJI_COLS * EMOJI_ROWS_DEFAULT
  const visible = expanded || search.trim() ? filtered : filtered.slice(0, defaultCount)
  const hasMore = !search.trim() && EMOJI_DATA.length > defaultCount

  return (
    <div className="flex flex-col gap-2">
      {/* Поиск */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('categories.emojiSearch')}
          className="w-full rounded-[10px] bg-bg-input pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">🔍</span>
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Сетка эмодзи */}
      <div
        className={`grid gap-1.5 ${expanded || search.trim() ? 'max-h-48 overflow-y-auto scrollbar-none' : ''}`}
        style={{ gridTemplateColumns: `repeat(${EMOJI_COLS}, minmax(0, 1fr))` }}
      >
        {visible.map((item) => (
          <button
            key={item.e}
            type="button"
            onClick={() => onChange(item.e)}
            className={`flex h-9 w-full items-center justify-center rounded-[10px] text-xl transition-colors ${
              value === item.e ? 'bg-primary/20 ring-1 ring-primary' : 'bg-bg-input hover:bg-bg-hover'
            }`}
          >
            {item.e}
          </button>
        ))}
        {visible.length === 0 && (
          <p className="col-span-7 py-4 text-center text-xs text-text-muted">{t('common.empty')}</p>
        )}
      </div>

      {/* Показать все / скрыть */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors text-center py-1"
        >
          {expanded
            ? t('categories.emojiShowLess')
            : t('categories.emojiShowMore', { count: EMOJI_DATA.length - defaultCount })}
        </button>
      )}

      {/* Своя иконка */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted whitespace-nowrap">{t('categories.emojiCustom')}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => { if (e.target.value.length <= 2) onChange(e.target.value) }}
          placeholder="📁"
          className="w-14 rounded-[10px] bg-bg-input px-2 py-2 text-center text-xl text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  )
}
