import { redirect } from 'next/navigation';
import { getAuthTokenFromCookies } from '@/lib/auth/session';

export default async function HomePage() {
  const token = await getAuthTokenFromCookies();

  if (token) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
