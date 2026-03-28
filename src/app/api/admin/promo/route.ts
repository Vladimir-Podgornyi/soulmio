import { NextResponse } from 'next/server'
import { requireAdmin } from '@/shared/lib/adminGuard'

export async function GET() {
  const adminOrResponse = await requireAdmin()
  if (adminOrResponse instanceof Response) return adminOrResponse

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ promoCodes: [] })
  }

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeKey, { apiVersion: '2026-03-25.dahlia' })

    const promoCodes = await stripe.promotionCodes.list({
      limit: 20,
      expand: ['data.promotion.coupon'],
    })

    const result = promoCodes.data.map((pc) => {
      const couponRef = pc.promotion.coupon
      // When expanded, coupon is a Stripe.Coupon object; otherwise a string id
      const coupon =
        typeof couponRef === 'object' && couponRef !== null
          ? couponRef
          : null

      let discountLabel = ''
      if (coupon) {
        if (coupon.percent_off) {
          discountLabel = `${coupon.percent_off}%`
          if (
            coupon.duration === 'repeating' &&
            coupon.duration_in_months
          ) {
            discountLabel += ` · ${coupon.duration_in_months} mo`
          } else if (coupon.duration === 'once') {
            discountLabel += ' · once'
          } else if (coupon.duration === 'forever') {
            discountLabel += ' · forever'
          }
        } else if (coupon.amount_off) {
          discountLabel = `${(coupon.amount_off / 100).toFixed(2)} ${(coupon.currency ?? 'usd').toUpperCase()}`
        }
      }

      return {
        id: pc.id,
        code: pc.code,
        discountLabel,
        timesRedeemed: pc.times_redeemed ?? 0,
        active: pc.active,
        expiresAt: pc.expires_at
          ? new Date(pc.expires_at * 1000).toISOString()
          : null,
      }
    })

    return NextResponse.json({ promoCodes: result })
  } catch (err) {
    console.error('Stripe promo fetch error:', err)
    return NextResponse.json({ promoCodes: [] })
  }
}
