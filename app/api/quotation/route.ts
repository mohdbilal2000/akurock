import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIP } from '@/lib/rate-limiter';
import { sanitizeFormData } from '@/lib/sanitize';
import { sendQuotationNotifications } from '@/lib/notify';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 quotation submissions per minute per IP
    const ip = getClientIP(request.headers);
    const { success } = rateLimit(`quotation:${ip}`, { maxRequests: 5, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const data = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      address,
      city,
      postalCode,
      country,
      message,
      cartItems,
      total
    } = data;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !address || !city || !postalCode || !country) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Sanitize all text inputs to prevent XSS
    const sanitized = sanitizeFormData({
      firstName, lastName, email, phone,
      company: company || '', address, city, postalCode, country,
      message: message || '',
    });

    // TODO: Save to database when Prisma schema includes Quotation model
    // const quotation = await prisma.quotation.create({
    //   data: { ...sanitized, cartItems, total, status: 'PENDING' }
    // });

    // Notify the owner by email + WhatsApp. Never blocks the customer's
    // submission; failures are logged (see lib/notify.ts for env config).
    await sendQuotationNotifications({ ...sanitized, cartItems, total });

    return NextResponse.json({
      success: true,
      message: 'Quotation request submitted successfully'
    });

  } catch (error) {
    console.error('Error processing quotation:', error);
    return NextResponse.json(
      { error: 'Failed to process quotation request' },
      { status: 500 }
    );
  }
}
