import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { BRAND } from '@/lib/constants';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const { priceAmount, promoCode } = await req.json();

    // Check if promo code gives 100% discount
    if (promoCode && promoCode.toUpperCase() === 'LETEMCOOK') {
      return NextResponse.json({
        success: true,
        free: true,
        sessionId: null,
        url: null,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'The Refinery - Professional Resume & Cover Letter Package',
              description: 'Complete job search documents with lifetime access',
            },
            unit_amount: priceAmount || BRAND.pricing.refineryStripe, // cents
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
