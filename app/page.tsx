import { translateHTML } from '@/lib/i18n/translate-html';

// Root page serves the German homepage directly — no redirect
export default async function RootPage() {
  const locale = 'de';
  
  // Reuse the localized homepage component logic
  const { default: HomePage } = await import('./(localized)/[locale]/page');
  
  return HomePage({ params: Promise.resolve({ locale }) });
}
