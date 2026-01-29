/**
 * Rate Limiting for SMR-Refinery
 * Only limits FAILED payment attempts (not successful purchases)
 */

import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import { Resend } from 'resend';

const redis = new Redis(process.env.KV_REST_API_REDIS_URL || process.env.REDIS_URL || '');
const resend = new Resend(process.env.RESEND_API_KEY);

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] :
             request.headers.get('x-real-ip') ||
             'unknown';
  return ip.trim();
}

/**
 * Log payment attempt
 */
export async function logPaymentAttempt(
  ip: string,
  success: boolean,
  promoCode?: string,
  amount?: number
): Promise<void> {
  const logEntry = {
    ip,
    success,
    promoCode,
    amount,
    timestamp: new Date().toISOString(),
  };

  console.log('[REFINERY PAYMENT]', JSON.stringify(logEntry));

  // Store in Redis for 7 days
  const key = `payment_log:${Date.now()}`;
  await redis.setex(key, 60 * 60 * 24 * 7, JSON.stringify(logEntry));
}

/**
 * Send alert for suspicious payment activity
 */
async function sendPaymentAlert(
  ip: string,
  failedAttempts: number
): Promise<void> {
  try {
    await resend.emails.send({
      from: 'Refinery Security <onboarding@resend.dev>',
      to: ['troyrichardcarr@gmail.com'],
      subject: `⚠️ Multiple Failed Payments: ${ip}`,
      html: `
        <h2>🚨 Suspicious Payment Activity</h2>
        <p><strong>IP Address:</strong> ${ip}</p>
        <p><strong>Failed Attempts:</strong> ${failedAttempts}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST</p>
        <hr>
        <p><strong>Possible causes:</strong></p>
        <ul>
          <li>Brute-forcing promo codes</li>
          <li>Testing stolen credit cards</li>
          <li>Legitimate user with card issues (less likely after ${failedAttempts} attempts)</li>
        </ul>
        <p>This IP has been rate limited. Check Vercel logs for details.</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send payment alert:', error);
  }
}

/**
 * Check rate limit for failed payment attempts
 */
export async function checkFailedPaymentLimit(
  request: NextRequest
): Promise<{ allowed: boolean; remaining: number }> {
  const ip = getClientIP(request);
  const key = `failed_payments:${ip}`;
  const MAX_FAILED = 10;
  const WINDOW_MS = 60 * 60 * 1000; // 1 hour

  try {
    const current = await redis.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= MAX_FAILED) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: MAX_FAILED - count };
  } catch (error) {
    console.error('Failed payment limit check error:', error);
    return { allowed: true, remaining: MAX_FAILED };
  }
}

/**
 * Record failed payment attempt
 */
export async function recordFailedPayment(
  request: NextRequest,
  promoCode?: string
): Promise<void> {
  const ip = getClientIP(request);
  const key = `failed_payments:${ip}`;
  const WINDOW_SECONDS = 60 * 60; // 1 hour

  try {
    const newCount = await redis.incr(key);

    if (newCount === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    await logPaymentAttempt(ip, false, promoCode);

    // Send alert on threshold
    if (newCount === 10) {
      await sendPaymentAlert(ip, newCount);
    }
  } catch (error) {
    console.error('Failed to record failed payment:', error);
  }
}

/**
 * Record successful payment
 */
export async function recordSuccessfulPayment(
  request: NextRequest,
  promoCode?: string,
  amount?: number
): Promise<void> {
  const ip = getClientIP(request);

  // Clear failed attempts on success
  const key = `failed_payments:${ip}`;
  await redis.del(key);

  await logPaymentAttempt(ip, true, promoCode, amount);
}
