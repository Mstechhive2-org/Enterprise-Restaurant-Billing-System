import React, { useState, useEffect, useCallback } from 'react';
import { getDailyStats } from '../api/billing';
import { 
  TrendingUp, 
  Receipt, 
  ShoppingBag, 
  DollarSign,
  RefreshCw,
  Clock,
  CreditCard,
  Wallet,
  Smartphone,
  Activity,
  Package,
  Percent,
  TrendingDown,
  Truck
} from 'lucide-react';
import Toast from './Toast';
import { LayoutDashboard } from 'lucide-react';

const Dashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    sales: 0,
    orders: 0,
    averageOrderValue: 0,
    totalItems: 0,
    totalDiscount: 0,
    totalTax: 0,
    paymentMethods: [],
    activeOrders: 0,
    deliveryOrders: 0,
    dineInOrders: 0,
    takeawayOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lastResetDate, setLastResetDate] = useState(() => {
    const today = new Date().toDateString();
    return localStorage.getItem('dashboardLastDate') || today;
  });

  // Fetch today's stats - Optimized with error handling
  const fetchTodayStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDailyStats();
      // Only update if we're still on the same day
      const today = new Date().toDateString();
      const storedDate = localStorage.getItem('dashboardLastDate') || today;
      
      if (storedDate === today) {
        setStats(data);
      } else {
        // Day changed, reset to zero
        setStats({
          sales: 0,
          orders: 0,
          averageOrderValue: 0,
          totalItems: 0,
          totalDiscount: 0,
          totalTax: 0,
          paymentMethods: [],
          activeOrders: 0,
          deliveryOrders: 0,
          dineInOrders: 0,
          takeawayOrders: 0
        });
        localStorage.setItem('dashboardLastDate', today);
        setLastResetDate(today);
      }
    } catch (error) {
      console.error('Error fetching today stats:', error);
      setToast({ message: 'Failed to load dashboard data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if day has changed and reset if needed
  useEffect(() => {
    const checkDayChange = () => {
      const today = new Date().toDateString();
      const storedDate = localStorage.getItem('dashboardLastDate');
      
      if (storedDate !== today) {
        // Day has changed, reset stats and fetch new data
        setStats({
          sales: 0,
          orders: 0,
          averageOrderValue: 0,
          totalItems: 0,
          totalDiscount: 0,
          totalTax: 0,
          paymentMethods: [],
          activeOrders: 0,
          deliveryOrders: 0,
          dineInOrders: 0,
          takeawayOrders: 0
        });
        localStorage.setItem('dashboardLastDate', today);
        setLastResetDate(today);
        // Fetch new day's stats
        fetchTodayStats();
      }
    };

    // Check immediately
    checkDayChange();

    // Set up interval to check every minute
    const interval = setInterval(checkDayChange, 60000);

    // Set up midnight reset
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      checkDayChange();
      // Then check every minute after midnight
      setInterval(checkDayChange, 60000);
    }, msUntilMidnight);

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimeout);
    };
  }, [fetchTodayStats]);

  // Update current date every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTodayStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTodayStats, 30000);
    
    return () => clearInterval(interval);
  }, [fetchTodayStats]);

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getPaymentIcon = (mode) => {
    switch (mode) {
      case 'Cash': return <Wallet size={16} />;
      case 'UPI': return <Smartphone size={16} />;
      case 'Card': return <CreditCard size={16} />;
      default: return <CreditCard size={16} />;
    }
  };

  if (loading && stats.sales === 0 && stats.orders === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 via-accent/3 to-secondary/5 rounded-xl p-4 border border-border/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-main mb-0.5">Today's Dashboard</h1>
              <p className="text-xs text-text-muted font-medium">{formatDate(currentDate)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate && onNavigate('billing')}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                <LayoutDashboard size={16} />
                <span className="text-sm">Quick Billing</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg border border-border/50">
                <Clock size={16} className="text-primary" />
                <span className="text-base font-mono font-bold text-text-main">{formatTime(currentDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-6 gap-4">
          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-xl p-5 border border-success/20 shadow-sm hover:shadow-lg hover:border-success/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                <DollarSign className="text-success" size={20} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Today's Revenue</p>
              <p className="text-2xl font-bold text-text-main leading-tight">{formatCurrency(stats.sales)}</p>
            </div>
          </div>

          {/* Dine-In Orders Card */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <ShoppingBag className="text-primary" size={20} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Dine-In Orders</p>
              <p className="text-2xl font-bold text-text-main leading-tight">{stats.dineInOrders}</p>
            </div>
          </div>

          {/* Takeaway Orders Card */}
          <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl p-5 border border-secondary/20 shadow-sm hover:shadow-lg hover:border-secondary/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                <Package className="text-secondary" size={20} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Takeaway Orders</p>
              <p className="text-2xl font-bold text-text-main leading-tight">{stats.takeawayOrders}</p>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-5 border border-accent/20 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-accent" size={20} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Avg Order Value</p>
              <p className="text-2xl font-bold text-text-main leading-tight">{formatCurrency(stats.averageOrderValue)}</p>
            </div>
          </div>

          {/* Active Orders */}
          <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl p-5 border border-secondary/20 shadow-sm hover:shadow-lg hover:border-secondary/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                <Activity className="text-secondary" size={20} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Active Orders</p>
              <p className="text-2xl font-bold text-text-main leading-tight">{stats.activeOrders}</p>
            </div>
          </div>

          {/* Delivery Orders */}
          <div className="bg-gradient-to-br from-orange-100/50 to-orange-50/30 rounded-xl p-5 border border-orange-200/50 shadow-sm hover:shadow-lg hover:border-orange-300/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-200/50 rounded-lg flex items-center justify-center">
                <Truck className="text-orange-600" size={20} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Delivery Orders</p>
              <p className="text-2xl font-bold text-text-main leading-tight">{stats.deliveryOrders || 0}</p>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Items Sold */}
          <div className="bg-surface/80 backdrop-blur-sm rounded-lg p-4 border border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Package className="text-primary" size={18} />
                </div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Items Sold</span>
              </div>
              <span className="text-lg font-bold text-text-main">{stats.totalItems}</span>
            </div>
          </div>

          {/* Discount Given */}
          <div className="bg-surface/80 backdrop-blur-sm rounded-lg p-4 border border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-success/10 rounded-lg flex items-center justify-center">
                  <Percent className="text-success" size={18} />
                </div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Discount Given</span>
              </div>
              <span className="text-lg font-bold text-text-main">{formatCurrency(stats.totalDiscount)}</span>
            </div>
          </div>

          {/* Tax Collected */}
          <div className="bg-surface/80 backdrop-blur-sm rounded-lg p-4 border border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Receipt className="text-accent" size={18} />
                </div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Tax Collected</span>
              </div>
              <span className="text-lg font-bold text-text-main">{formatCurrency(stats.totalTax)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        {stats.paymentMethods && stats.paymentMethods.length > 0 && (
          <div className="bg-surface rounded-xl p-5 border border-border shadow-sm">
            <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-primary" />
              Payment Methods
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {stats.paymentMethods.map((method, index) => {
                const totalRevenue = stats.paymentMethods.reduce((sum, m) => sum + m.revenue, 0);
                const percentage = totalRevenue > 0 ? ((method.revenue / totalRevenue) * 100).toFixed(1) : 0;
                const colors = [
                  'from-primary to-primary/60',
                  'from-secondary to-secondary/60',
                  'from-accent to-accent/60'
                ];
                const colorClass = colors[index % colors.length];
                
                return (
                  <div key={method._id || index} className="bg-gradient-to-br from-surface to-surface-hover rounded-lg p-4 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center text-white`}>
                        {getPaymentIcon(method._id)}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-text-main">{method._id || 'Unknown'}</p>
                        <p className="text-xs text-text-muted">{method.count} transactions</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xl font-bold text-text-main">{formatCurrency(method.revenue)}</p>
                      <p className="text-xs text-text-muted">{percentage}% of total</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp className="text-primary" size={16} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-text-main mb-1">Dashboard Information</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                This dashboard shows real-time statistics for today only. The data automatically resets at midnight (00:00) 
                and starts fresh for the new day. Stats are updated every 30 seconds automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center">
          <button
            onClick={fetchTodayStats}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Now</span>
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;

