'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Zap, LogOut, Settings, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Contacts', path: '/dashboard/contacts', icon: Users },
    { name: 'Extractor', path: '/dashboard/extractor', icon: Download },
    { name: 'Campaigns', path: '/dashboard/campaigns', icon: Zap },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-20">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-5 border-b border-gray-200">
        <Link href="/dashboard">
          <Image src="/logos_cropped.png" alt="BulkPing" width={140} height={36} className="h-7 w-auto object-contain" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                ? 'bg-green-50 text-green-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-green-700' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Area */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-5 h-5 text-gray-400" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
