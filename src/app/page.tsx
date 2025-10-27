import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  // Redirect to the login page
  redirect('/login');
}

