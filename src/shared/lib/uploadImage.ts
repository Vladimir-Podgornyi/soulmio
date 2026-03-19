import { createClient } from '@/shared/api/supabase'

const BUCKET = 'item-images'
const AVATAR_BUCKET = 'avatars'
const MAX_PX = 800
const QUALITY = 0.82

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => b ? resolve(b) : reject(new Error('toBlob failed')),
      'image/jpeg',
      quality
    )
  )
}

/**
 * Сжимает изображение на клиенте через Canvas.
 * Результат: JPEG ≤ 800px по длинной стороне, качество 82%.
 */
async function compressImage(file: File): Promise<Blob> {
  const img = await loadImage(file)
  const { naturalWidth: w, naturalHeight: h } = img
  const scale = Math.min(1, MAX_PX / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No canvas context')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvasToBlob(canvas, QUALITY)
}

/**
 * Кропит изображение до квадрата по центру и масштабирует до size×size.
 * Используется для аватаров.
 */
export async function cropToSquare(file: File, size = 300): Promise<Blob> {
  const img = await loadImage(file)
  const { naturalWidth: w, naturalHeight: h } = img
  const side = Math.min(w, h)
  const sx = (w - side) / 2
  const sy = (h - side) / 2
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No canvas context')
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)
  return canvasToBlob(canvas, 0.88)
}

async function uploadBlob(bucket: string, blob: Blob, path: string): Promise<string> {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) {
    console.error('[uploadImage] Supabase Storage error:', error)
    throw error
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

async function getUserId(): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Сжимает файл и загружает в Supabase Storage.
 * Возвращает публичный URL.
 */
export async function uploadImage(file: File): Promise<string> {
  const userId = await getUserId()
  const blob = await compressImage(file)
  return uploadBlob(BUCKET, blob, `${userId}/${uid()}.jpg`)
}

/**
 * Кропит аватар до квадрата и загружает в bucket `avatars`.
 * Возвращает публичный URL.
 */
export async function uploadAvatar(file: File): Promise<string> {
  const userId = await getUserId()
  const blob = await cropToSquare(file)
  return uploadBlob(AVATAR_BUCKET, blob, `${userId}/${uid()}.jpg`)
}
