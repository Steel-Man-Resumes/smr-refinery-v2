'use client';

import { useState } from 'react';
import { useRefinery } from '@/store/refineryStore';
import GlassPanel from '@/components/ui/GlassPanel';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { BRAND } from '@/lib/constants';

export default function PaymentStage() {
  const { state, setPaymentSessionId, setPaymentCompleted, setStage, prevStage } = useRefinery();
  const [promoCode, setPromoCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const price = BRAND.pricing.refinery; // $37.21
  const finalPrice = appliedDiscount === 100 ? 0 : price * (1 - appliedDiscount / 100);

  const handleApplyPromo = () => {
    const upperPromo = promoCode.toUpperCase();
    const discount = BRAND.promoCodes[upperPromo as keyof typeof BRAND.promoCodes];

    if (discount) {
      setPromoApplied(true);
      setAppliedDiscount(discount);
      if (discount === 100) {
        alert('🎉 Promo code applied! Your documents are FREE!');
      } else {
        alert(`✅ Promo code applied! ${discount}% off - Now $${(price * (1 - discount / 100)).toFixed(2)}`);
      }
    } else {
      alert('❌ Invalid promo code');
    }
  };

  const handleCheckout = async () => {
    setIsProcessing(true);

    try {
      // If free with promo code, skip Stripe
      if (finalPrice === 0) {
        setPaymentCompleted(true);
        // Trigger document generation now that payment is confirmed
        setStage('generation');
        return;
      }

      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceAmount: BRAND.pricing.refineryStripe, // cents
          promoCode: promoCode || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId, url } = await response.json();
      setPaymentSessionId(sessionId);

      // Mark payment as completed before redirect
      // (Stripe will confirm on return)
      setPaymentCompleted(true);

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      alert(`Payment error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassPanel className="p-12 max-w-3xl w-full">
        <h2 className="text-4xl font-headline text-steelGold headline-glow mb-4 text-center">
          Almost There
        </h2>
        <p className="text-paperWhite text-center mb-8">
          One payment. Unlimited edits. Lifetime access to your documents.
        </p>

        {/* Pricing Summary */}
        <div className="glass-panel p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-paperWhite">The Refinery Package</span>
            <span className="text-paperWhite">${price.toFixed(2)}</span>
          </div>
          {promoApplied && (
            <div className="flex justify-between items-center text-steelGold">
              <span>Promo Code Applied</span>
              <span>-${price.toFixed(2)}</span>
            </div>
          )}
          <hr className="border-glassBorder my-4" />
          <div className="flex justify-between items-center text-xl font-bold">
            <span className="text-paperWhite">Total</span>
            <span className="text-steelGold">
              ${finalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* What's Included */}
        <div className="glass-panel p-6 mb-6">
          <h3 className="text-xl font-headline text-steelGold mb-4">What You Get:</h3>
          <ul className="space-y-2 text-paperWhite">
            <li>✓ Professionally written resume (DOCX)</li>
            <li>✓ Custom cover letter template (DOCX)</li>
            <li>✓ 30-day action plan with daily tasks (DOCX)</li>
            <li>✓ 50 target employers with research (DOCX)</li>
            <li>✓ Personal web portfolio page (HTML)</li>
            {(state.forgePayload?.barriers?.challenges?.length ?? 0) > 0 && (
              <li>✓ Alloy Report - barrier strategies (DOCX)</li>
            )}
            {state.portfolioOptions.extras_job_tracker && (
              <li>✓ Job application tracker (XLSX)</li>
            )}
            <li>✓ Unlimited regeneration (30 days)</li>
            <li>✓ Lifetime download access</li>
          </ul>
        </div>

        {/* Promo Code */}
        <div className="mb-6">
          <div className="flex gap-2">
            <Input
              type="text"
              value={promoCode}
              onChange={setPromoCode}
              placeholder="Got a promo code?"
              disabled={promoApplied}
            />
            <Button
              variant="secondary"
              onClick={handleApplyPromo}
              disabled={promoApplied || !promoCode.trim()}
            >
              Apply
            </Button>
          </div>
          {promoApplied && (
            <p className="text-steelGold text-sm mt-2">
              ✓ Promo code applied: {appliedDiscount}% off!
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <Button variant="secondary" onClick={prevStage} disabled={isProcessing}>
            ← Back
          </Button>
          <Button
            variant="primary"
            onClick={handleCheckout}
            fullWidth
            disabled={isProcessing}
          >
            {isProcessing
              ? '⏳ Processing...'
              : finalPrice === 0
              ? '🎉 Get My Documents (FREE!)'
              : `Pay $${finalPrice.toFixed(2)} & Download →`}
          </Button>
        </div>

        <p className="text-industrialGray text-xs text-center mt-6">
          🔒 Secure payment powered by Stripe. We never see your card details.
        </p>

        <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-paperWhite/70 text-xs text-center">
            Don't use cards? Text Troy at{' '}
            <a
              href="tel:+12623918137"
              className="text-steelGold hover:underline font-semibold"
            >
              (262) 391-8137
            </a>
            {' '}for alternative payment options
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}
