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

const Dashboard = () => {
  const [stats, setStats] = useState({ 
    sales: 0, 
    orders: 0,
    averageOrderValue: 0,
    totalItems: 0,
    totalDiscount: 0,
    totalTax: 0,
    paymentMethods: [],
    activeOrders: 0,
    deliveryOrders: 0
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
          deliveryOrders: 0
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
          deliveryOrders: 0
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-main mb-1">Today's Dashboard</h1>
              <p className="text-sm text-text-muted">{formatDate(currentDate)}</p>
            </div>
            <div className="flex items-center gap-3 text-text-muted">
              <Clock size={18} />
              <span className="text-lg font-mono font-bold text-text-main">{formatTime(currentDate)}</span>
            </div>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-xl p-4 border border-success/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="text-success" size={20} />
                <span className="text-sm font-bold text-text-muted">Today's Revenue</span>
              </div>
              <span className="text-xl font-bold text-text-main">{formatCurrency(stats.sales)}</span>
            </div>
          </div>

          {/* Orders Card */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-primary" size={20} />
                <span className="text-sm font-bold text-text-muted">Completed Orders</span>
              </div>
              <span className="text-xl font-bold text-text-main">{stats.orders}</span>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-4 border border-accent/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-accent" size={20} />
                <span className="text-sm font-bold text-text-muted">Avg Order Value</span>
              </div>
              <span className="text-xl font-bold text-text-main">{formatCurrency(stats.averageOrderValue)}</span>
            </div>
          </div>

          {/* Active Orders */}
          <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl p-4 border border-secondary/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="text-secondary" size={20} />
                <span className="text-sm font-bold text-text-muted">Active Orders</span>
              </div>
              <span className="text-xl font-bold text-text-main">{stats.activeOrders}</span>
            </div>
          </div>

          {/* Delivery Orders */}
          <div className="bg-gradient-to-br from-orange-100/50 to-orange-50/30 rounded-xl p-4 border border-orange-200/50 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="text-orange-600" size={20} />
                <span className="text-sm font-bold text-text-muted">Delivery Orders</span>
              </div>
              <span className="text-xl font-bold text-text-main">{stats.deliveryOrders || 0}</span>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Items Sold */}
          <div className="bg-surface rounded-lg p-3 border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="text-primary" size={18} />
                <span className="text-xs font-bold text-text-muted">Items Sold</span>
              </div>
              <span className="text-lg font-bold text-text-main">{stats.totalItems}</span>
            </div>
          </div>

          {/* Discount Given */}
          <div className="bg-surface rounded-lg p-3 border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="text-success" size={18} />
                <span className="text-xs font-bold text-text-muted">Discount Given</span>
              </div>
              <span className="text-lg font-bold text-text-main">{formatCurrency(stats.totalDiscount)}</span>
            </div>
          </div>

          {/* Tax Collected */}
          <div className="bg-surface rounded-lg p-3 border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="text-accent" size={18} />
                <span className="text-xs font-bold text-text-muted">Tax Collected</span>
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

