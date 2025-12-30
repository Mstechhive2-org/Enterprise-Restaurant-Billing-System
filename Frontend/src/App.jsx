import React, { useState, useEffect, Suspense } from 'react';
// Lazy load components for performance
const BillingPage = React.lazy(() => import('./components/BillingPage'));
const BillHistory = React.lazy(() => import('./components/BillHistory'));
const LoginPage = React.lazy(() => import('./components/LoginPage'));
const MenuManagement = React.lazy(() => import('./components/MenuManagement'));
const ActiveOrders = React.lazy(() => import('./components/ActiveOrders'));
const Analytics = React.lazy(() => import('./components/Analytics'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Settings = React.lazy(() => import('./components/Settings'));
const DeliveryOrders = React.lazy(() => import('./components/DeliveryOrders'));
import { LogOut, LayoutDashboard, History, User, UtensilsCrossed, ClipboardList, BarChart3, Home, Settings as SettingsIcon, Truck } from 'lucide-react';
import { getOpenOrders } from './api/billing';
import { logoutUser } from './api/auth';
import './App.css';

function App() {
  const [view, setView] = useState('dashboard'); // Default to dashboard view
  const [selectedTable, setSelectedTable] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [restaurantName, setRestaurantName] = useState('RestoPOS');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Load restaurant settings
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('restaurantSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setRestaurantName(settings.restaurantName);
        document.title = `${settings.restaurantName} - Restaurant Management`;
      } else {
        setRestaurantName('RestoPOS');
        document.title = 'RestoPOS - Restaurant Management';
      }
    };

    loadSettings();

    // Listen for settings updates
    const handleSettingsUpdate = (event) => {
      loadSettings();
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchActiveOrdersCount();
    }
  }, [user]);

  const fetchActiveOrdersCount = async () => {
    try {
      const orders = await getOpenOrders();
      setActiveOrdersCount(orders.length);
    } catch (error) {
      console.error('Error fetching active orders count:', error);
    }
  };

  const handleLoginSuccess = (data) => {
    setUser(data.user);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const handleLogout = async () => {
    try {
      // Call logout API to invalidate session on server
      await logoutUser();
    } catch (error) {
      // Even if logout API fails, clear local state
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call result
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  };

  const handleViewChange = (newView) => {
    // setSectionLoading(true); // Removed manual loading state, relying on Suspense
    setView(newView);
    // Removed artificial delay
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-background text-text-muted">Loading...</div>;

  if (!user) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    );
  }

  const getTitle = () => {
    switch (view) {
      case 'dashboard': return 'Dashboard';
      case 'billing': return 'New Order';
      case 'history': return 'Transaction History';
      case 'menu': return 'Menu Management';
      case 'analytics': return 'Analytics';
      case 'delivery': return 'Delivery Orders';
      case 'settings': return 'Settings';
      default: return 'RestoPOS';
    }
  };

  return (
    <div className="h-screen flex bg-background text-text-main font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-surface flex flex-col shrink-0 shadow-xl z-20">
        <div className="h-20 flex items-center px-6">
          <div className="flex items-center gap-3 font-bold text-xl text-primary">
            <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <UtensilsCrossed size={22} />
            </div>
            <span className="tracking-tight">{restaurantName}</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => handleViewChange('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-medium ${view === 'dashboard' ? 'bg-primary text-white shadow-lg shadow-primary/25 translate-x-2' : 'text-text-muted hover:bg-surface-hover hover:text-text-main hover:translate-x-1'}`}
          >
            <Home size={20} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => handleViewChange('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-medium relative ${view === 'orders' ? 'bg-primary text-white shadow-lg shadow-primary/25 translate-x-2' : 'text-text-muted hover:bg-surface-hover hover:text-text-main hover:translate-x-1'}`}
          >
            <ClipboardList size={20} />
            <span>Active Orders</span>
            {activeOrdersCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${view === 'orders' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                {activeOrdersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleViewChange('delivery')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-medium ${view === 'delivery' ? 'bg-primary text-white shadow-lg shadow-primary/25 translate-x-2' : 'text-text-muted hover:bg-surface-hover hover:text-text-main hover:translate-x-1'}`}
          >
            <Truck size={20} />
            <span>Delivery Orders</span>
          </button>
          <button
            onClick={() => handleViewChange('billing')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-medium ${view === 'billing' ? 'bg-primary text-white shadow-lg shadow-primary/25 translate-x-2' : 'text-text-muted hover:bg-surface-hover hover:text-text-main hover:translate-x-1'}`}
          >
            <LayoutDashboard size={20} />
            <span>New Order</span>
          </button>
          <button
            onClick={() => handleViewChange('history')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-medium ${view === 'history' ? 'bg-primary text-white shadow-lg shadow-primary/25 translate-x-2' : 'text-text-muted hover:bg-surface-hover hover:text-text-main hover:translate-x-1'}`}
          >
            <History size={20} />
            <span>Bill History</span>
          </button>
          <button
            onClick={() => handleViewChange('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-medium ${view === 'analytics' ? 'bg-primary text-white shadow-lg shadow-primary/25 translate-x-2' : 'text-text-muted hover:bg-surface-hover hover:text-text-main hover:translate-x-1'}`}
          >
            <BarChart3 size={20} />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => handleViewChange('menu')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-medium ${view === 'menu' ? 'bg-primary text-white shadow-lg shadow-primary/25 translate-x-2' : 'text-text-muted hover:bg-surface-hover hover:text-text-main hover:translate-x-1'}`}
          >
            <UtensilsCrossed size={20} />
            <span>Menu</span>
          </button>
          <button
            onClick={() => handleViewChange('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-medium ${view === 'settings' ? 'bg-primary text-white shadow-lg shadow-primary/25 translate-x-2' : 'text-text-muted hover:bg-surface-hover hover:text-text-main hover:translate-x-1'}`}
          >
            <SettingsIcon size={20} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-danger bg-danger/5 hover:bg-danger/10 transition-all font-medium hover:shadow-md"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Topbar */}
        {view !== 'billing' && (
          <header className="h-20 flex items-center justify-between px-8 shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-text-main tracking-tight">
                {getTitle()}
              </h1>
              <p className="text-sm text-text-muted">Welcome back, {user.username}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-2 py-1.5 bg-surface rounded-full shadow-sm pr-4">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                  <User size={20} />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-bold text-text-main">{user.username}</span>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">{user.role}</span>
                </div>
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 overflow-hidden p-6">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-text-muted font-medium">Loading...</p>
              </div>
            </div>
          }>
            {view === 'dashboard' && <Dashboard onNavigate={handleViewChange} />}
            {view === 'orders' && (
              <ActiveOrders
                onSelectOrder={(tableNo) => {
                  setSelectedTable(tableNo);
                  handleViewChange('billing');
                }}
                onOrderUpdate={fetchActiveOrdersCount}
              />
            )}
            {view === 'billing' && <BillingPage initialTable={selectedTable} onOrderUpdate={fetchActiveOrdersCount} />}
            {view === 'history' && <BillHistory />}
            {view === 'analytics' && <Analytics />}
            {view === 'menu' && <MenuManagement user={user} />}
            {view === 'delivery' && <DeliveryOrders />}
            {view === 'settings' && <Settings />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
