import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await kv.get(`handoff:${params.id}`);

    if (!payload) {
      console.log(`[Handoff] ID not found or expired: ${params.id}`);
      return NextResponse.json(
        { error: 'Handoff link not found or expired (24hr limit)' },
        { status: 404 }
      );
    }

    console.log(`[Handoff] Retrieved handoff ID: ${params.id}`);

    // kv.get already returns parsed JSON, but handle string case
    const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;

    return NextResponse.json(parsedPayload);
  } catch (error: any) {
    console.error('[Handoff] Error retrieving handoff:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve handoff data' },
      { status: 500 }
    );
  }
}
