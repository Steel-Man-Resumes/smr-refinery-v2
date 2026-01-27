import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || '');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await redis.get(`handoff:${params.id}`);

    if (!payload) {
      console.log(`[Handoff] ID not found or expired: ${params.id}`);
      return NextResponse.json(
        { error: 'Handoff link not found or expired (24hr limit)' },
        { status: 404 }
      );
    }

    console.log(`[Handoff] Retrieved handoff ID: ${params.id}`);

    // Parse the JSON string from Redis
    const parsedPayload = JSON.parse(payload);

    return NextResponse.json(parsedPayload);
  } catch (error: any) {
    console.error('[Handoff] Error retrieving handoff:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve handoff data' },
      { status: 500 }
    );
  }
}
