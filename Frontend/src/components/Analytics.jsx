import React, { useState, useEffect } from 'react';
import { getAnalytics, downloadDailyReportCSV, downloadMonthlyReportExcel } from '../api/analytics';
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  DollarSign,
  Calendar,
  BarChart3,
  CreditCard,
  Wallet,
  Smartphone,
  RefreshCw,
  Download,
  FileSpreadsheet,
  Truck
} from 'lucide-react';
import Toast from './Toast';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [days, setDays] = useState(null); // For 7 or 30 days view
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'days'
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMonth, selectedYear, days, viewMode]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let data;
      if (viewMode === 'month') {
        data = await getAnalytics(selectedMonth, selectedYear, null);
      } else {
        data = await getAnalytics(null, null, days);
      }
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setToast({ message: 'Failed to load analytics data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNum) => {
    const date = new Date(2000, monthNum - 1, 1);
    return date.toLocaleDateString('en-IN', { month: 'long' });
  };

  const getAvailableMonths = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      });
    }
    return months;
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getMaxRevenue = () => {
    if (!analytics?.dailyRevenue || analytics.dailyRevenue.length === 0) return 1;
    return Math.max(...analytics.dailyRevenue.map(d => d.revenue));
  };

  const getPaymentModeIcon = (mode) => {
    switch (mode) {
      case 'Cash': return <Wallet size={20} />;
      case 'UPI': return <Smartphone size={20} />;
      case 'Card': return <CreditCard size={20} />;
      default: return <CreditCard size={20} />;
    }
  };

  const handleDownloadReport = async () => {
    try {
      setToast({ message: 'Generating report...', type: 'info' });
      if (viewMode === 'month') {
        await downloadMonthlyReportExcel(selectedMonth, selectedYear);
      } else {
        // For days view, use the monthly Excel endpoint with current month
        await downloadMonthlyReportExcel(new Date().getMonth() + 1, new Date().getFullYear());
      }
      setToast({ message: 'Report downloaded successfully!', type: 'success' });
    } catch (error) {
      console.error('Error downloading report:', error);
      setToast({ message: 'Failed to download report', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-text-muted">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted">No analytics data available</p>
      </div>
    );
  }

  const { summary, dailyRevenue, paymentModeStats } = analytics;
  const maxRevenue = getMaxRevenue();

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Period Selector */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-surface rounded-xl p-1 border border-border">
              <button
                onClick={() => {
                  setViewMode('month');
                  setDays(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'month'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => {
                  setViewMode('days');
                  setDays(7);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'days'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
                }`}
              >
                Days
              </button>
            </div>
            
            {viewMode === 'month' ? (
              <div className="flex items-center gap-2 bg-surface rounded-xl px-4 py-2 border border-border">
                <Calendar size={16} className="text-text-muted" />
                <select
                  value={`${selectedYear}-${selectedMonth}`}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split('-').map(Number);
                    setSelectedYear(year);
                    setSelectedMonth(month);
                  }}
                  className="bg-transparent font-medium text-text-main focus:outline-none cursor-pointer"
                >
                  {getAvailableMonths().map((m) => (
                    <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-surface rounded-xl p-1 border border-border">
                {[7, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      days === d
                        ? 'bg-primary text-white shadow-md'
                        : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-success hover:bg-success/90 rounded-xl border border-success transition-all text-white"
            >
              <FileSpreadsheet size={16} />
              <span className="text-sm font-medium">Download Report</span>
            </button>
            <button
              onClick={fetchAnalytics}
              className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover rounded-xl border border-border transition-all text-text-main"
            >
              <RefreshCw size={16} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Total Bills */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="text-primary" size={18} />
                <span className="text-xs font-bold text-text-muted">Total Bills</span>
              </div>
              <span className="text-lg font-bold text-text-main">{summary.totalBills.toLocaleString()}</span>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg p-3 border border-secondary/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-secondary" size={18} />
                <span className="text-xs font-bold text-text-muted">Total Orders</span>
              </div>
              <span className="text-lg font-bold text-text-main">{summary.totalOrders.toLocaleString()}</span>
            </div>
          </div>

          {/* Today's Revenue */}
          <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-3 border border-success/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-success" size={18} />
                <span className="text-xs font-bold text-text-muted">Today's Revenue</span>
              </div>
              <span className="text-lg font-bold text-text-main">{formatCurrency(summary.today.revenue)}</span>
            </div>
          </div>

          {/* Period Revenue */}
          <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-3 border border-accent/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="text-accent" size={18} />
                <span className="text-xs font-bold text-text-muted">
                  {viewMode === 'month' ? `${getMonthName(selectedMonth)} ${selectedYear}` : `${days} Days`} Revenue
                </span>
              </div>
              <span className="text-lg font-bold text-text-main">{formatCurrency(summary.period.revenue)}</span>
            </div>
          </div>

          {/* Delivery Orders */}
          <div className="bg-gradient-to-br from-orange-100/50 to-orange-50/30 rounded-lg p-3 border border-orange-200/50 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="text-orange-600" size={18} />
                <span className="text-xs font-bold text-text-muted">Delivery Orders</span>
              </div>
              <span className="text-lg font-bold text-text-main">{summary.period.deliveryOrders?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Revenue Chart */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="text-primary" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-main">Daily Revenue & Orders</h2>
                  <p className="text-xs text-text-muted">
                    {viewMode === 'month' 
                      ? `${getMonthName(selectedMonth)} ${selectedYear}` 
                      : `Last ${days} days`}
                  </p>
                </div>
              </div>
            </div>
            
            {dailyRevenue && dailyRevenue.length > 0 ? (
              <div className="space-y-4">
                {/* Chart */}
                <div className="flex items-end justify-between gap-2 h-64">
                  {dailyRevenue.map((day, index) => {
                    const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col items-center justify-end h-full">
                          <div
                            className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg transition-all hover:from-primary/80 hover:to-primary/40 cursor-pointer group relative"
                            style={{ height: `${Math.max(height, 5)}%` }}
                            title={`${formatDate(day._id)}: ${formatCurrency(day.revenue)}`}
                          >
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-text-main text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                              <div className="font-bold">{formatCurrency(day.revenue)}</div>
                              <div className="text-[10px]">Orders: {day.orders}</div>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-text-muted font-medium">
                          {new Date(day._id).getDate()}/{new Date(day._id).getMonth() + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Daily Breakdown Table */}
                <div className="mt-6 border border-border rounded-xl overflow-hidden">
                  <div className="bg-primary/5 px-4 py-3 border-b border-border">
                    <h3 className="font-bold text-text-main text-sm">Daily Breakdown</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-surface-hover sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-bold text-text-muted uppercase">Date</th>
                          <th className="text-right px-4 py-2 text-xs font-bold text-text-muted uppercase">Revenue</th>
                          <th className="text-right px-4 py-2 text-xs font-bold text-text-muted uppercase">Bills</th>
                          <th className="text-right px-4 py-2 text-xs font-bold text-text-muted uppercase">Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyRevenue.map((day, index) => (
                          <tr key={index} className="border-b border-border hover:bg-surface-hover transition-colors">
                            <td className="px-4 py-2 text-sm font-medium text-text-main">
                              {formatDate(day._id)}
                            </td>
                            <td className="px-4 py-2 text-sm font-bold text-text-main text-right">
                              {formatCurrency(day.revenue)}
                            </td>
                            <td className="px-4 py-2 text-sm text-text-muted text-right">
                              {day.bills}
                            </td>
                            <td className="px-4 py-2 text-sm text-text-muted text-right">
                              {day.orders}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-xs text-text-muted">Total Revenue</p>
                    <p className="text-lg font-bold text-text-main">
                      {formatCurrency(dailyRevenue.reduce((sum, d) => sum + d.revenue, 0))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted">Total Bills</p>
                    <p className="text-lg font-bold text-text-main">
                      {dailyRevenue.reduce((sum, d) => sum + d.bills, 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted">Avg Daily</p>
                    <p className="text-lg font-bold text-text-main">
                      {formatCurrency(
                        dailyRevenue.reduce((sum, d) => sum + d.revenue, 0) / dailyRevenue.length
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-text-muted">
                <p>No revenue data for the selected period</p>
              </div>
            )}
          </div>

          {/* Payment Mode Breakdown */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="text-secondary" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-main">Payment Methods</h2>
                  <p className="text-xs text-text-muted">
                    {viewMode === 'month' 
                      ? `${getMonthName(selectedMonth)} ${selectedYear}` 
                      : `Last ${days} days`}
                  </p>
                </div>
              </div>
            </div>
            
            {paymentModeStats && paymentModeStats.length > 0 ? (
              <div className="space-y-4">
                {paymentModeStats.map((stat, index) => {
                  const totalRevenue = paymentModeStats.reduce((sum, s) => sum + s.revenue, 0);
                  const percentage = totalRevenue > 0 ? (stat.revenue / totalRevenue) * 100 : 0;
                  const colors = [
                    'from-primary to-primary/60',
                    'from-secondary to-secondary/60',
                    'from-accent to-accent/60'
                  ];
                  const colorClass = colors[index % colors.length];
                  
                  return (
                    <div key={stat._id || index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center text-white`}>
                            {getPaymentModeIcon(stat._id)}
                          </div>
                          <div>
                            <p className="font-bold text-text-main">{stat._id || 'Unknown'}</p>
                            <p className="text-xs text-text-muted">{stat.count} transactions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-text-main">{formatCurrency(stat.revenue)}</p>
                          <p className="text-xs text-text-muted">{percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${colorClass} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-4 border-t border-border mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-text-muted">Total</p>
                    <p className="text-lg font-bold text-text-main">
                      {formatCurrency(
                        paymentModeStats.reduce((sum, s) => sum + s.revenue, 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-text-muted">
                <p>No payment data for the selected period</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-surface rounded-xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="text-primary" size={18} />
              <h3 className="font-bold text-text-main text-sm">Period Summary</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Bills</span>
                <span className="font-bold text-text-main text-sm">{summary.period.bills}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Orders</span>
                <span className="font-bold text-text-main text-sm">{summary.period.orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Avg Bill</span>
                <span className="font-bold text-text-main text-sm">
                  {formatCurrency(summary.period.averageBill)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="text-success" size={18} />
              <h3 className="font-bold text-text-main text-sm">Discounts & Tax</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Total Discount</span>
                <span className="font-bold text-text-main text-sm">
                  {formatCurrency(summary.period.discount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Total Tax</span>
                <span className="font-bold text-text-main text-sm">
                  {formatCurrency(summary.period.tax)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Net Revenue</span>
                <span className="font-bold text-success text-sm">
                  {formatCurrency(summary.period.revenue)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="text-accent" size={18} />
              <h3 className="font-bold text-text-main text-sm">Today's Performance</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Bills</span>
                <span className="font-bold text-text-main text-sm">{summary.today.bills}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Orders</span>
                <span className="font-bold text-text-main text-sm">{summary.today.orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Avg Bill</span>
                <span className="font-bold text-text-main text-sm">
                  {formatCurrency(summary.today.averageBill)}
                </span>
              </div>
            </div>
          </div>
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

export default Analytics;

