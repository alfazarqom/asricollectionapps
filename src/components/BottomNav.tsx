import React from 'react';
import { Home, Grid, Package, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export type TabType = 'home' | 'categories' | 'cart' | 'orders' | 'account' | 'admin';

interface BottomNavProps {
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Tentukan tab aktif berdasarkan rute saat ini
  const pathname = location.pathname;
  let currentTab: TabType = 'home';
  if (pathname.startsWith('/categories')) {
    currentTab = 'categories';
  } else if (pathname.startsWith('/orders')) {
    currentTab = 'orders';
  } else if (
    pathname.startsWith('/account') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/refund') ||
    pathname.startsWith('/shipping') ||
    pathname.startsWith('/contact')
  ) {
    currentTab = 'account';
  } else if (pathname.startsWith('/admin')) {
    currentTab = 'admin';
  } else if (activeTab) {
    currentTab = activeTab;
  }

  const navItems = [
    { id: 'home' as TabType, path: '/', label: 'Beranda', icon: Home },
    { id: 'categories' as TabType, path: '/categories', label: 'Kategori', icon: Grid },
    { id: 'orders' as TabType, path: '/orders', label: 'Pesanan', icon: Package },
    { id: 'account' as TabType, path: '/account', label: 'Akun', icon: User },
  ];

  const handleNavClick = (item: (typeof navItems)[0]) => {
    if (setActiveTab) {
      setActiveTab(item.id);
    }
    navigate(item.path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-[480px] mx-auto bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg pb-safe">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (item.id === 'account' && (currentTab === 'admin' || pathname.startsWith('/admin')));

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative active:scale-95 touch-manipulation ${
                isActive ? 'text-[#2563EB]' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
              </div>
              <span className={`text-[11px] mt-1 tracking-tight font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
