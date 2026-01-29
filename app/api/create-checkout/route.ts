import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { BRAND } from '@/lib/constants';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const { priceAmount, promoCode } = await req.json();

    // Check if valid promo code and calculate discount
    let discount = 0;
    if (promoCode) {
      const upperPromo = promoCode.toUpperCase();
      discount = BRAND.promoCodes[upperPromo as keyof typeof BRAND.promoCodes] || 0;
    }

    // If 100% discount, skip payment
    if (discount === 100) {
      return NextResponse.json({
        success: true,
        free: true,
        discount: 100,
        sessionId: null,
        url: null,
      });
    }

    // Calculate discounted price
    const basePrice = priceAmount || BRAND.pricing.refineryStripe;
    const discountedPrice = Math.round(basePrice * (1 - discount / 100));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'The Refinery - Professional Resume & Cover Letter Package',
              description: discount > 0
                ? `Complete job search documents (${discount}% off!)`
                : 'Complete job search documents with lifetime access',
            },
            unit_amount: discountedPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/?canceled=true`,
      metadata: {
        product: 'refinery_package',
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
