import Bill from '../models/Bill.js';
import ExcelJS from 'exceljs';

// Get comprehensive analytics
export const getAnalytics = async (req, res) => {
  try {
    const { month, year, days } = req.query;
    
    let startDate, endDate;
    
    // If month and year are provided, use month-wise
    if (month && year) {
      const monthNum = parseInt(month) - 1; // JavaScript months are 0-indexed
      const yearNum = parseInt(year);
      startDate = new Date(yearNum, monthNum, 1);
      startDate.setHours(0, 0, 0, 0);
      
      // Get last day of the month
      endDate = new Date(yearNum, monthNum + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (days) {
      // Fallback to days if provided
      const daysCount = parseInt(days);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Optimize: Run queries in parallel for better performance
    const [totalBills, totalOrders, todayStats, dailyRevenue, periodStats, paymentModeStats, deliveryOrdersStats] = await Promise.all([
      // Total bills count (all time) - use estimated count for better performance
      Bill.countDocuments({ status: 'Paid' }),
      // Total orders count (all time - includes all statuses)
      Bill.countDocuments(),
      // Today's statistics
      Bill.aggregate([
        {
          $match: {
            createdAt: { $gte: todayStart, $lte: todayEnd },
            status: 'Paid'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalBills: { $sum: 1 },
            totalOrders: { $sum: 1 },
            averageBill: { $avg: '$total' }
          }
        }
      ]),
      // Daily revenue breakdown for the specified period
      Bill.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'Paid'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            revenue: { $sum: '$total' },
            bills: { $sum: 1 },
            orders: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]),
      // Overall statistics for the period
      Bill.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'Paid'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalBills: { $sum: 1 },
            totalOrders: { $sum: 1 },
            averageBill: { $avg: '$total' },
            totalDiscount: { $sum: '$discount' },
            totalTax: { $sum: '$tax' }
          }
        }
      ]),
      // Payment mode breakdown
      Bill.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'Paid'
          }
        },
        {
          $group: {
            _id: '$paymentMode',
            count: { $sum: 1 },
            revenue: { $sum: '$total' }
          }
        }
      ]),
      // Delivery orders count for the period
      Bill.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'Paid',
        $or: [
          { billType: 'Delivery' },
          { orderSource: { $exists: true, $ne: null } }
        ]
      })
    ]);

    const today = todayStats[0] || {
      totalRevenue: 0,
      totalBills: 0,
      totalOrders: 0,
      averageBill: 0
    };

    const period = periodStats[0] || {
      totalRevenue: 0,
      totalBills: 0,
      totalOrders: 0,
      averageBill: 0,
      totalDiscount: 0,
      totalTax: 0
    };

    res.json({
      summary: {
        totalBills,
        totalOrders,
        today: {
          revenue: today.totalRevenue,
          bills: today.totalBills,
          orders: today.totalOrders,
          averageBill: Math.round(today.averageBill || 0)
        },
        period: {
          revenue: period.totalRevenue,
          bills: period.totalBills,
          orders: period.totalOrders,
          averageBill: Math.round(period.averageBill || 0),
          discount: period.totalDiscount,
          tax: period.totalTax,
          deliveryOrders: deliveryOrdersStats || 0
        }
      },
      dailyRevenue,
      paymentModeStats
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: error.message });
  }
};

// Download daily report in CSV format
export const downloadDailyReportCSV = async (req, res) => {
  try {
    const { month, year, days } = req.query;

    let startDate, endDate, periodName;

    if (month && year) {
      const monthNum = parseInt(month) - 1;
      const yearNum = parseInt(year);
      startDate = new Date(yearNum, monthNum, 1);
      endDate = new Date(yearNum, monthNum + 1, 0);
      periodName = `${new Date(yearNum, monthNum).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;
    } else if (days) {
      const daysCount = parseInt(days);
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);
      periodName = `Last ${daysCount} Days`;
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      periodName = `${now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;
    }

    endDate.setHours(23, 59, 59, 999);
    startDate.setHours(0, 0, 0, 0);

    const bills = await Bill.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'Paid'
    }).sort({ createdAt: -1 });

    // CSV Header
    let csv = 'Date,Time,Bill ID,Table,Items,Subtotal,Discount,Tax,Total,Payment Mode\n';

    // CSV Data
    bills.forEach(bill => {
      const date = new Date(bill.createdAt).toLocaleDateString('en-IN');
      const time = new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const items = bill.items.map(item => `${item.name}(${item.quantity})`).join('; ');
      csv += `${date},${time},${bill._id},${bill.tableNo},"${items}",${bill.subtotal},${bill.discount},${bill.tax},${bill.total},${bill.paymentMode}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="daily-report-${periodName.replace(/\s+/g, '-').toLowerCase()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error generating CSV report:', error);
    res.status(500).json({ message: error.message });
  }
};

// Download monthly report in Excel format
export const downloadMonthlyReportExcel = async (req, res) => {
  try {
    const { month, year } = req.query;

    let startDate, endDate, periodName;

    if (month && year) {
      const monthNum = parseInt(month) - 1;
      const yearNum = parseInt(year);
      startDate = new Date(yearNum, monthNum, 1);
      endDate = new Date(yearNum, monthNum + 1, 0);
      periodName = `${new Date(yearNum, monthNum).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      periodName = `${now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;
    }

    endDate.setHours(23, 59, 59, 999);
    startDate.setHours(0, 0, 0, 0);

    const bills = await Bill.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'Paid'
    })
    .select('billNumber tableNo items subtotal discount tax total paymentMode billType orderSource createdAt')
    .sort({ createdAt: -1 })
    .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Monthly Report');

    // Add title
    worksheet.mergeCells('A1:L1');
    worksheet.getCell('A1').value = `Restaurant Billing Report - ${periodName}`;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Add headers
    worksheet.getRow(3).values = ['Date', 'Time', 'Bill ID', 'Bill Type', 'Table/Order', 'Item Count', 'Subtotal', 'Discount', 'Tax', 'Total', 'Payment Mode', 'Platform'];
    worksheet.getRow(3).font = { bold: true };
    worksheet.getRow(3).eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
    });

    // Calculate payment method totals
    const paymentTotals = {
      Card: 0,
      UPI: 0,
      Cash: 0
    };

    // Add data
    bills.forEach((bill, index) => {
      const row = worksheet.getRow(index + 4);
      
      // Determine platform for delivery orders
      let platform = '';
      if (bill.billType === 'Delivery' && bill.orderSource) {
        platform = bill.orderSource;
      }
      
      // Calculate item count
      const itemCount = bill.items ? bill.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
      
      // Calculate payment totals
      if (bill.paymentMode && paymentTotals.hasOwnProperty(bill.paymentMode)) {
        paymentTotals[bill.paymentMode] += bill.total || 0;
      }
      
      row.values = [
        new Date(bill.createdAt).toLocaleDateString('en-IN'),
        new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        bill.billNumber || '', // Use billNumber instead of _id
        bill.billType || 'Dine-In',
        bill.tableNo || '',
        itemCount,
        bill.subtotal || 0,
        bill.discount || 0,
        bill.tax || 0,
        bill.total || 0,
        bill.paymentMode || '',
        platform
      ];
    });

    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
      if (index === 2) { // Bill ID
        column.width = 20;
      } else if (index === 3) { // Bill Type
        column.width = 12;
      } else if (index === 4) { // Table/Order
        column.width = 15;
      } else if (index === 5) { // Item Count
        column.width = 12;
      } else if (index >= 6 && index <= 9) { // Financial columns
        column.width = 14;
      } else {
        column.width = 15;
      }
    });

    // Format financial columns as currency
    const financialColumns = [6, 7, 8, 9]; // Subtotal, Discount, Tax, Total
    bills.forEach((bill, index) => {
      financialColumns.forEach(colIndex => {
        const cell = worksheet.getCell(index + 4, colIndex + 1);
        cell.numFmt = '#,##0.00';
      });
    });

    // Add summary at the bottom
    const totalRow = bills.length + 4;
    const summaryRow = worksheet.getRow(totalRow);
    summaryRow.values = [
      'TOTAL',
      '',
      '',
      '',
      '',
      bills.reduce((sum, bill) => sum + (bill.items ? bill.items.reduce((s, item) => s + (item.quantity || 0), 0) : 0), 0),
      bills.reduce((sum, bill) => sum + (bill.subtotal || 0), 0),
      bills.reduce((sum, bill) => sum + (bill.discount || 0), 0),
      bills.reduce((sum, bill) => sum + (bill.tax || 0), 0),
      bills.reduce((sum, bill) => sum + (bill.total || 0), 0),
      '',
      ''
    ];
    summaryRow.font = { bold: true };
    financialColumns.forEach(colIndex => {
      const cell = worksheet.getCell(totalRow, colIndex + 1);
      cell.numFmt = '#,##0.00';
    });

    // Add payment method totals
    const cardRow = worksheet.getRow(totalRow + 1);
    cardRow.values = [
      'CARD TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      paymentTotals.Card,
      'Card',
      ''
    ];
    cardRow.font = { bold: true };
    worksheet.getCell(totalRow + 1, 10).numFmt = '#,##0.00';

    const upiRow = worksheet.getRow(totalRow + 2);
    upiRow.values = [
      'UPI TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      paymentTotals.UPI,
      'UPI',
      ''
    ];
    upiRow.font = { bold: true };
    worksheet.getCell(totalRow + 2, 10).numFmt = '#,##0.00';

    const cashRow = worksheet.getRow(totalRow + 3);
    cashRow.values = [
      'CASH TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      paymentTotals.Cash,
      'Cash',
      ''
    ];
    cashRow.font = { bold: true };
    worksheet.getCell(totalRow + 3, 10).numFmt = '#,##0.00';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${periodName.replace(/\s+/g, '-').toLowerCase()}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).json({ message: error.message });
  }
};



