import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingCartIcon, BellIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const navItems = [
  { to: '/', label: 'Tổng quan', end: true },
  { to: '/hang-hoa', label: 'Hàng hóa' },
  { to: '/ban-hang', label: 'Bán hàng' },
  { to: '/bao-cao', label: 'Báo cáo' },
  { to: '/tai-khoan', label: 'Tài khoản' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBell, setShowBell] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top bar: logo + icons */}
      <div className="bg-white px-4 flex items-center justify-between h-11 border-b border-gray-200">
        <div className="flex items-center gap-2 font-bold text-base text-gray-800">
          <ShoppingCartIcon className="w-5 h-5 text-green-600" />
          <span>DemoApp</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Bell */}
          <div className="relative">
            <button onClick={() => { setShowBell(!showBell); setShowUserMenu(false); }}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-700">
              <BellIcon className="w-5 h-5" />
            </button>
            {showBell && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 w-72 z-50 py-2">
                <p className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">Thông báo</p>
                <p className="px-4 py-3 text-sm text-gray-400 text-center">Không có thông báo mới</p>
              </div>
            )}
          </div>
          {/* User */}
          <div className="relative">
            <button onClick={() => { setShowUserMenu(!showUserMenu); setShowBell(false); }}
              className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200">
              <UserCircleIcon className="w-5 h-5 text-green-700" />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 w-48 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">{user?.tenht}</p>
                  <p className="text-xs text-gray-500">{user?.sdt}</p>
                </div>
                <button onClick={() => { navigate('/tai-khoan'); setShowUserMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <UserCircleIcon className="w-4 h-4" /> Tài khoản
                </button>
                <button onClick={() => { logout(); navigate('/login'); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <ArrowRightOnRectangleIcon className="w-4 h-4" /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav bar: green */}
      <nav className="bg-green-600 px-4 flex items-center h-10">
        <div className="flex items-center gap-1 flex-1">
          {navItems.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `px-4 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-green-700 text-white' : 'text-green-100 hover:bg-green-700 hover:text-white'
                }`
              }>
              {label}
            </NavLink>
          ))}
        </div>
        <button onClick={() => navigate('/ban-hang')}
          className="flex items-center gap-1.5 bg-white text-green-700 font-semibold text-sm px-3 py-1 rounded hover:bg-green-50 transition-colors border border-white">
          <ShoppingCartIcon className="w-4 h-4" />
          Bán hàng
        </button>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-4">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-green-600 h-6" />

      {/* Overlay to close menus */}
      {(showUserMenu || showBell) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowUserMenu(false); setShowBell(false); }} />
      )}
    </div>
  );
}
