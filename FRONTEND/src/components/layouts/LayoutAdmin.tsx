import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Hotel, 
  CalendarCheck, 
  Star, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Bell,
  ChevronRight,
  User,
  Coffee,
  Image as ImageIcon,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const LayoutAdmin: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Hotel Management', path: '/admin/hotels', icon: Hotel },
    { name: 'Room Types', path: '/admin/room-types', icon: Coffee },
    { name: 'Booking Management', path: '/admin/bookings', icon: CalendarCheck },
    { name: 'Review Management', path: '/admin/reviews', icon: Star },
    { name: 'Payment Management', path: '/admin/payments', icon: CreditCard },
    { name: 'Amenities', path: '/admin/amenities', icon: ShieldCheck },
    { name: 'Image Management', path: '/admin/images', icon: ImageIcon },
    { name: 'Roles & Permissions', path: '/admin/roles', icon: ShieldCheck },
  ];

  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.name : 'Admin Panel';
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Hotel size={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">StayHub</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Admin Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon size={20} className={location.pathname === item.path ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                <span>{item.name}</span>
                {location.pathname === item.path && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Profile at Bottom */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-2">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                {user?.name?.[0] || <User size={20} />}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || 'admin@stayhub.com'}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200 font-medium"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
              <span className="text-slate-400">Admin</span>
              <ChevronRight size={14} className="text-slate-300" />
              <span className="text-slate-900 font-semibold">{getPageTitle()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            {/* Search Bar */}
            <div className="hidden md:flex items-center relative group">
              <Search className="absolute left-3 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 rounded-xl text-sm transition-all outline-none w-64"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Settings */}
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
              <Settings size={22} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default LayoutAdmin;
