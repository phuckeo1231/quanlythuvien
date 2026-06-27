'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const NAV = [
  { href: '/dashboard', label: 'Tổng quan',  icon: '📊' },
  { href: '/books',     label: 'Sách',        icon: '📚' },
  { href: '/members',   label: 'Thành viên',  icon: '👥' },
  { href: '/loans',     label: 'Mượn / Trả',  icon: '🔄' },
  { href: '/reports',   label: 'Báo cáo',     icon: '📈' },
];

const ADMIN_NAV = [
  { href: '/users', label: 'Nhân viên', icon: '🛡️' },
];

export default function Sidebar() {
  const path = usePathname();
  const { data: session } = useSession();
  const nav = session?.user?.role === 'admin' ? [...NAV, ...ADMIN_NAV] : NAV;

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📚</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">Thư viện Sách</p>
            <p className="text-xs text-gray-400">Hệ thống quản lý</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(item => {
          const active = path === item.href || path.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors"
        >
          <span>🚪</span> Đăng xuất
        </button>
      </div>
    </aside>
  );
}
