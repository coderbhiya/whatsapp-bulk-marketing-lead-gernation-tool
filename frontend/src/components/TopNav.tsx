'use client';

import { Bell, Search, ChevronDown, Crown, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import UpgradeModal from './UpgradeModal';

export default function TopNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string; plan?: string; sentMessagesCount?: number } | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch('https://apibulkping.senseforge.in/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        }
      }
    } catch (e) { }
  };

  useEffect(() => {
    fetchProfile();
  }, [pathname]);

  const parts = pathname?.split('/') || [];
  const lastPart = parts[parts.length - 1];
  const title =
    pathname === '/dashboard' || !lastPart
      ? 'Overview'
      : lastPart.charAt(0).toUpperCase() + lastPart.slice(1);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const isPro = user?.plan === 'PRO';
  const sentCount = user?.sentMessagesCount || 0;

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10 w-full shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">{title}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Plan Badge & Upgrade Button */}
          {isPro ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-emerald-600 text-white rounded-full text-xs font-bold shadow-sm">
              <Crown className="w-3.5 h-3.5 fill-white" />
              <span>PRO PLAN</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-medium">
                <span>Free Plan: <strong>{sentCount}/5</strong> msgs</span>
              </div>
              <button
                onClick={() => setIsUpgradeOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl text-xs font-bold hover:shadow-md hover:shadow-[#25D366]/30 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Upgrade ₹99
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative hidden lg:block">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366] w-48 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Bell */}
          <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>

          {/* User Avatar */}
          <button className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-[#25D366]/20">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-gray-800 leading-none">{user?.name?.split(' ')[0] || 'User'}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[90px]">{user?.email || ''}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </header>

      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </>
  );
}
