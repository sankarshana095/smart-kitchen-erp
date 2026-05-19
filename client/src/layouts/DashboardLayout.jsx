import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
  FiGrid,
  FiCpu,
  FiCoffee,
  FiBox,
  FiPlusSquare,
  FiBarChart2,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiBell,
  FiMenu,
  FiX,
  FiAlertTriangle,
  FiCheckCircle,
} from 'react-icons/fi';

const DashboardLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch notifications periodically
  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000); // every 20 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await API.post('/notifications/clear');
      setNotifications([]);
      setShowNotifications(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: FiGrid },
    { name: 'Ingredients', path: '/ingredients', icon: FiCoffee },
    { name: 'Inventory Stock', path: '/inventory', icon: FiBox },
    { name: 'Dishes', path: '/dishes', icon: FiPlusSquare },
    { name: 'Cooking Module', path: '/cooking', icon: FiCpu },
    { name: 'Analytics', path: '/analytics', icon: FiBarChart2 },
    { name: 'Reports', path: '/reports', icon: FiFileText },
  ];

  if (isAdmin) {
    menuItems.push({ name: 'System Settings', path: '/settings', icon: FiSettings });
  }

  const getPageTitle = () => {
    const matched = menuItems.find((item) => item.path === location.pathname);
    return matched ? matched.name : 'Smart Kitchen';
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      {/* SIDEBAR FOR DESKTOP */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-slate-900 text-white transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col items-center justify-center p-5 bg-slate-950/60 border-b border-slate-800/60 relative">
          <Link to="/" className="flex items-center justify-center py-2">
            <img 
              src="/logo.jpg" 
              alt="Logo" 
              className="h-40 w-40 object-contain rounded-full border-2 border-slate-700 shadow-md transition-transform hover:scale-105 duration-200" 
            />
          </Link>
          <button className="md:hidden text-white absolute top-4 right-4" onClick={() => setSidebarOpen(false)}>
            <FiX size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-650 text-white shadow-lg bg-indigo-600'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="truncate">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role.toLowerCase().replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 transition-colors p-2"
            title="Log Out"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </aside>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col md:pl-64 overflow-hidden">
        {/* TOP NAVBAR */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 z-10 shadow-sm">
          <div className="flex items-center space-x-4">
            <button className="md:hidden text-gray-600" onClick={() => setSidebarOpen(true)}>
              <FiMenu size={22} />
            </button>
            <h1 className="text-lg font-bold text-gray-800 md:text-xl">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* NOTIFICATIONS PANEL */}
            <div className="relative">
              <button
                className="relative p-2 text-gray-600 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-150 z-30 flex flex-col py-2 animate-fade-in">
                    <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">Notifications</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={handleClearNotifications}
                          className="text-xs text-indigo-600 hover:text-indigo-850 hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-72">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">
                          No alerts or warnings.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkAsRead(n.id)}
                            className={`flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                              !n.isRead ? 'bg-indigo-50/40' : ''
                            }`}
                          >
                            <div className="mt-0.5">
                              {n.type === 'LOW_STOCK' || n.type === 'INSUFFICIENT_STOCK' ? (
                                <FiAlertTriangle className="text-amber-500" size={16} />
                              ) : (
                                <FiCheckCircle className="text-emerald-500" size={16} />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">{n.message}</p>
                              <p className="text-[9px] text-gray-400 mt-1">
                                {new Date(n.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* USER CARD */}
            <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-gray-700 truncate max-w-[120px]">
                  {user?.name}
                </p>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-800 uppercase tracking-wide">
                  {user?.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
