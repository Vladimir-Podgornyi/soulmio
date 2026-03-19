import { createClient } from '@/shared/api/supabase'

const BUCKET = 'item-images'
const MAX_PX = 800
const QUALITY = 0.82

/**
 * Сжимает изображение на клиенте через Canvas.
 * Результат: JPEG ≤ 800px по длинной стороне, качество 82%.
 */
function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const { naturalWidth: w, naturalHeight: h } = img
      const scale = Math.min(1, MAX_PX / Math.max(w, h))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('No canvas context')); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')),
        'image/jpeg',
        QUALITY
      )
    }

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')) }
    img.src = objectUrl
  })
}

/**
 * Сжимает файл и загружает в Supabase Storage.
 * Возвращает публичный URL или выбрасывает ошибку.
 *
 * Предварительно нужно создать bucket `item-images` в Supabase
 * с публичным доступом (Public bucket: on).
 */
export async function uploadImage(file: File): Promise<string> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const compressed = await compressImage(file)

  const ext = 'jpg'
  const name = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(name, compressed, { contentType: 'image/jpeg', upsert: false })

  if (error) {
    console.error('[uploadImage] Supabase Storage error:', error)
    throw error
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(name)
  return data.publicUrl
}
