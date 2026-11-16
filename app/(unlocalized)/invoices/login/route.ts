import { NextResponse } from "next/server";
import { FIRM_COOKIE, FIRM_COOKIE_MAX_AGE, firmPassword, firmToken, isPasswordCorrect } from "@/lib/invoice/firmAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const given = String(form?.get("password") ?? "");
  const password = firmPassword();
  // 303: the browser follows with a GET, so a reload never re-posts the form.
  if (!password || !isPasswordCorrect(given)) {
    // A short pause makes guessing the password slow.
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.redirect(new URL("/invoices?wrong=1", request.url), 303);
  }
  const res = NextResponse.redirect(new URL("/invoices", request.url), 303);
  res.cookies.set(FIRM_COOKIE, firmToken(password), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/invoices",
    maxAge: FIRM_COOKIE_MAX_AGE,
  });
  return res;
}
