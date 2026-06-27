import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth.js';
import UsersPageClient from '@/components/users/UsersPageClient.jsx';

export const metadata = { title: 'Quản lý nhân viên — Thư viện' };

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') redirect('/dashboard');

  return <UsersPageClient />;
}
