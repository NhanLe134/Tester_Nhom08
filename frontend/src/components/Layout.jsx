import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon, CubeIcon, ShoppingCartIcon, DocumentTextIcon,
  ChartBarIcon, UserCircleIcon, BellIcon, ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/', label: 'Tổng quan', icon: HomeIcon, end: true },
  { to: '/hang-hoa', label: 'Hàng hóa', icon: CubeIcon },
  { to: '/ban-hang', label: 'Bán hàng', icon: ShoppingCartIcon },
  { to: '/hoa-don', label: 'Hóa đơn', icon: DocumentTextIcon },
  { to: '/bao-cao', label: 'Báo cáo', icon: ChartBarIcon },
  { to: '/tai-khoan', label: 'Tài khoản', icon: UserCircleIcon },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center h-14 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 font-bold text-lg mr-4 shrink-0">
            <ShoppingCartIcon className="w-6 h-6" />
            <span>DemoApp</span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive ? 'bg-green-700 text-white' : 'text-green-100 hover:bg-green-700 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/ban-hang')}
              className="bg-white text-green-700 font-semibold text-sm px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1"
            >
              <ShoppingCartIcon className="w-4 h-4" />
              Bán hàng
            </button>
            <button className="p-1.5 rounded-lg hover:bg-green-700 transition-colors">
              <BellIcon className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-green-700 transition-colors"
              >
                <UserCircleIcon className="w-6 h-6" />
                <span className="text-sm font-medium hidden sm:block">{user?.tenht || user?.tendn}</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 w-48 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{user?.tenht}</p>
                    <p className="text-xs text-gray-500">{user?.tendn}</p>
                  </div>
                  <button
                    onClick={() => { navigate('/tai-khoan'); setShowUserMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <UserCircleIcon className="w-4 h-4" /> Tài khoản
                  </button>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-green-600 text-green-100 text-center text-xs py-2">
        © 2024 Quản Lý Tiệm Tạp Hóa — DemoApp
      </footer>
    </div>
  );
}
