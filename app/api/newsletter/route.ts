import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIP } from '@/lib/rate-limiter';
import { isValidEmail, sanitizeText } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 newsletter subscriptions per minute per IP
    const ip = getClientIP(request.headers);
    const { success } = rateLimit(`newsletter:${ip}`, { maxRequests: 3, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const data = await request.json();
    const email = sanitizeText(data.email);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // TODO: Connect to email service (Mailchimp, SendGrid, Resend, etc.)
    // For now, log the subscription. In production, this would:
    // 1. Add the email to a mailing list
    // 2. Send a confirmation/welcome email
    console.log(`Newsletter subscription: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to the newsletter.',
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription.' },
      { status: 500 }
    );
  }
}
