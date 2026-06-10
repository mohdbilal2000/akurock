/**
 * Owner notifications for quotation/booking requests.
 *
 * Sends each new booking to BOTH:
 *  - Email, via the Resend REST API (https://resend.com)
 *  - WhatsApp, via CallMeBot (https://www.callmebot.com/blog/free-api-whatsapp-messages/)
 *
 * Both channels are optional and controlled by environment variables; a
 * missing/failed channel never blocks the customer's submission — failures
 * are logged so they show up in Vercel runtime logs.
 *
 * Required environment variables:
 *  - RESEND_API_KEY        — enables email. Get one at resend.com (free tier).
 *  - CALLMEBOT_APIKEY      — enables WhatsApp. One-time setup: from the target
 *                            WhatsApp number, send "I allow callmebot to send
 *                            me messages" to +34 644 51 95 23; the bot replies
 *                            with your apikey.
 * Optional:
 *  - QUOTATION_EMAIL_TO    — recipient (default: mb9400900@gmail.com)
 *  - QUOTATION_EMAIL_FROM  — verified Resend sender
 *                            (default: onboarding@resend.dev, works untested domains)
 *  - WHATSAPP_NOTIFY_NUMBER — target number (default: +919057597719, the
 *                            number used by the site's WhatsApp widget)
 */

interface CartItem {
  name?: string;
  quantity?: number;
  price?: number | string;
  [key: string]: unknown;
}

export interface QuotationPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  message: string;
  cartItems?: CartItem[];
  total?: number | string;
}

const EMAIL_TO = process.env.QUOTATION_EMAIL_TO || 'mb9400900@gmail.com';
const EMAIL_FROM = process.env.QUOTATION_EMAIL_FROM || 'AKUROCK Website <onboarding@resend.dev>';
const WHATSAPP_TO = process.env.WHATSAPP_NOTIFY_NUMBER || '+919057597719';

function formatCart(cartItems?: CartItem[], total?: number | string): string {
  if (!cartItems || cartItems.length === 0) return 'No cart items (general inquiry).';
  const lines = cartItems.map((item) => {
    const qty = item.quantity ?? 1;
    const price = item.price != null ? ` — ${item.price}` : '';
    return `  • ${qty}x ${item.name || 'Unknown item'}${price}`;
  });
  if (total != null) lines.push(`  Total: ${total}`);
  return lines.join('\n');
}

function formatBooking(q: QuotationPayload): string {
  return [
    `Name: ${q.firstName} ${q.lastName}`,
    `Email: ${q.email}`,
    `Phone: ${q.phone}`,
    q.company ? `Company: ${q.company}` : null,
    `Address: ${q.address}, ${q.postalCode} ${q.city}, ${q.country}`,
    q.message ? `Message: ${q.message}` : null,
    '',
    'Requested items:',
    formatCart(q.cartItems, q.total),
  ]
    .filter((line) => line !== null)
    .join('\n');
}

async function sendEmail(q: QuotationPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('Quotation email skipped: RESEND_API_KEY not set');
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [EMAIL_TO],
        reply_to: q.email,
        subject: `New booking request from ${q.firstName} ${q.lastName}`,
        text: formatBooking(q),
      }),
    });
    if (!res.ok) {
      console.error(`Quotation email failed: ${res.status} ${await res.text()}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Quotation email failed:', error);
    return false;
  }
}

async function sendWhatsApp(q: QuotationPayload): Promise<boolean> {
  const apiKey = process.env.CALLMEBOT_APIKEY;
  if (!apiKey) {
    console.warn('Quotation WhatsApp skipped: CALLMEBOT_APIKEY not set');
    return false;
  }
  try {
    const text = `🔔 New AKUROCK booking\n\n${formatBooking(q)}`;
    const url =
      'https://api.callmebot.com/whatsapp.php' +
      `?phone=${encodeURIComponent(WHATSAPP_TO)}` +
      `&text=${encodeURIComponent(text)}` +
      `&apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Quotation WhatsApp failed: ${res.status} ${await res.text()}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Quotation WhatsApp failed:', error);
    return false;
  }
}

/**
 * Fire both notification channels. Never throws — the customer's booking
 * must be accepted even if notifications fail. If NEITHER channel delivers,
 * the full payload is logged as a last resort so the booking is recoverable
 * from runtime logs.
 */
export async function sendQuotationNotifications(q: QuotationPayload): Promise<void> {
  const [emailOk, whatsappOk] = await Promise.all([sendEmail(q), sendWhatsApp(q)]);
  if (!emailOk && !whatsappOk) {
    console.error(
      'BOOKING NOT DELIVERED to any channel — full payload follows:\n' + formatBooking(q)
    );
  }
}
