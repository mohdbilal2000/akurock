import { permanentRedirect } from 'next/navigation';

// Root page redirects to default locale (308 permanent)
export default function RootPage() {
  permanentRedirect('/de');
}
