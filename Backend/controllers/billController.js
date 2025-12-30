import Bill from '../models/Bill.js';
import cache from '../utils/cache.js';

// Get active order for a table
export const getActiveOrder = async (req, res) => {
  try {
    const { tableNo } = req.params;
    const order = await Bill.findOne({ 
      tableNo, 
      status: { $in: ['Open', 'Billed'] } 
    });
    res.json(order || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create or Update Order (Open Status)
export const saveOrder = async (req, res) => {
  try {
    const { 
      tableNo, 
      items, 
      customerName, 
      customerPhone, 
      kitchenNotes, 
      billType,
      orderSource
    } = req.body;

    // Validate required fields
    if (!tableNo) {
      return res.status(400).json({ message: 'Table number is required' });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required and must not be empty' });
    }

    // Sanitize items and calculate item totals
    const sanitizedItems = items.map(item => ({
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
      total: Number(item.price) * Number(item.quantity)
    }));

    let order = await Bill.findOne({ 
      tableNo, 
      status: 'Open' 
    });

    const subtotal = sanitizedItems.reduce((sum, item) => sum + item.total, 0);

    if (order) {
      // Update existing order
      order.items = sanitizedItems;
      order.customerName = customerName;
      order.customerPhone = customerPhone;
      order.kitchenNotes = kitchenNotes;
      order.billType = billType || order.billType;
      
      // Update delivery fields if delivery order
      if (billType === 'Delivery') {
        order.orderSource = orderSource || 'Direct';
        order.deliveryStatus = 'Pending';
      } else {
        // Remove orderSource for Dine-In and Takeaway orders
        order.orderSource = undefined;
        order.deliveryStatus = undefined;
      }
      
      order.subtotal = subtotal;
      order.total = subtotal; // Tax/Discount applied at billing
      
      await order.save();
    } else {
      // Create new order
      const orderData = {
        tableNo,
        items: sanitizedItems,
        subtotal,
        total: subtotal,
        status: 'Open',
        billType: billType || 'Dine-In',
        customerName,
        customerPhone,
        kitchenNotes
      };

      // Add delivery fields only if delivery order
      if (billType === 'Delivery') {
        orderData.orderSource = orderSource || 'Direct';
        orderData.deliveryStatus = 'Pending';
      }
      // For Dine-In and Takeaway, orderSource should not be set (undefined)

      order = await Bill.create(orderData);
    }
    
    // Clear cache when order is updated
    cache.clear('dailyStats');
    cache.clear('openOrders');
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Error in saveOrder:', error);
    res.status(400).json({ message: error.message, details: error.errors });
  }
};

// Generate Bill (Lock Order)
export const generateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { discount, tax } = req.body;

    const order = await Bill.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'Open') return res.status(400).json({ message: 'Order already billed or paid' });

    // Generate Bill Number using timestamp for uniqueness
    const billNumber = `BILL-${Date.now()}`;

    order.status = 'Billed';
    order.billNumber = billNumber;
    order.discount = Number(discount) || 0;
    order.tax = Number(tax) || 0;

    // Calculate final total
    const taxableAmount = order.subtotal - order.discount;
    const taxAmount = (taxableAmount * order.tax) / 100;
    order.total = Math.round(taxableAmount + taxAmount);

    await order.save();
    
    // Clear cache when bill is generated
    cache.clear('dailyStats');
    cache.clear('openOrders');
    
    return res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Settle Bill (Payment) - Saves bill to history (status: 'Paid')
export const settleBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMode } = req.body;

    const order = await Bill.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Set status to 'Paid' - this makes it appear in billing history
    order.status = 'Paid';
    order.paymentMode = paymentMode;
    
    // Explicitly update the updatedAt timestamp to ensure latest bills show first
    order.updatedAt = new Date();
    
    // Save the bill - it's now in billing history with fresh timestamp
    await order.save();
    
    // Clear cache when bill is settled (most important for dashboard)
    cache.clear('dailyStats');
    cache.clear('openOrders');
    
    // Return the saved bill with all details
    res.json(order);
  } catch (error) {
    console.error('Error settling bill:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get all bills (for history) with pagination support - Optimized for 150+ orders/day
export const getBills = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Default 20 per page, max 100 for performance
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build query with search
    const query = { status: 'Paid' };
    if (search) {
      query.billNumber = { $regex: search, $options: 'i' };
    }

    let bills = [];
    let total = 0;

    try {
      // Use lean() for better performance with large datasets
      // Sort by updatedAt descending (newest first) - Latest paid bills appear first
      // Using updatedAt ensures bills that were just paid/completed show at the top
      // This ensures whatever billing was done most recently appears first
      bills = await Bill.find(query)
        .select('billNumber tableNo billType paymentMode total orderSource items status createdAt updatedAt') // Include status, orderSource and items for delivery filtering
        .sort({ updatedAt: -1, createdAt: -1 }) // Sort by updatedAt first (when paid), then createdAt as tiebreaker
        .skip(skip)
        .limit(limit)
        .lean(); // Use lean for faster queries
    } catch (error) {
      console.error('Error fetching bills list:', error);
      bills = [];
    }

    try {
      // Use estimatedDocumentCount for better performance on large collections
      total = await Bill.countDocuments(query);
    } catch (error) {
      console.error('Error counting bills:', error);
      total = bills.length; // Fallback to bills array length
    }
    
    // Ensure bills is an array
    const validBills = Array.isArray(bills) ? bills : [];
    
    res.json({
      bills: validBills,
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        totalBills: total,
        hasMore: skip + validBills.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    console.error('Error stack:', error.stack);
    
    // Always return default response to prevent frontend failure
    const defaultResponse = {
      bills: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalBills: 0,
        hasMore: false
      }
    };
    
    // Return 200 with default data so bill history page doesn't break
    res.status(200).json(defaultResponse);
  }
};

// Get a single bill by ID (with all details for invoice)
export const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    console.error('Error fetching bill by ID:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a bill
export const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBill = await Bill.findByIdAndDelete(id);
    if (!deletedBill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Clear cache when bill is deleted
    cache.clear('dailyStats');
    
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all open/billed orders (optimized for performance with caching)
export const getOpenOrders = async (req, res) => {
  try {
    const cacheKey = cache.getCacheKey('openOrders');
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const orders = await Bill.find({
      status: { $in: ['Open', 'Billed'] }
    })
    .select('tableNo items total status billNumber billType orderSource createdAt') // Include orderSource for delivery filtering
    .sort({ createdAt: -1 })
    .limit(100) // Limit to 100 most recent active orders
    .lean(); // Use lean for faster queries
    
    // Cache for 10 seconds (active orders change frequently)
    cache.set(cacheKey, orders, 10000);
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching open orders:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get daily statistics - Optimized with caching for 150+ orders/day
export const getDailyStats = async (req, res) => {
  try {
    // Use UTC dates to avoid timezone issues in production
    // MongoDB stores dates in UTC, so we need to query in UTC
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    
    // Ensure dates are valid
    if (isNaN(today.getTime()) || isNaN(tomorrow.getTime())) {
      throw new Error('Invalid date range');
    }
    
    const cacheKey = cache.getCacheKey('dailyStats', today.toISOString().split('T')[0]);
    
    // Check cache first (30 second TTL for real-time feel)
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Optimized: Single aggregation pipeline for better performance
    // Handle each query separately to catch individual errors
    let paidStats = [];
    let paymentStats = [];
    let activeOrders = 0;
    let deliveryStats = 0;

    try {
      // Get paid bills stats
      paidStats = await Bill.aggregate([
        {
          $match: {
            createdAt: { $gte: today, $lt: tomorrow },
            status: 'Paid'
          }
        },
        {
          $project: {
            total: { $ifNull: ['$total', 0] },
            discount: { $ifNull: ['$discount', 0] },
            tax: { $ifNull: ['$tax', 0] },
            items: { $ifNull: ['$items', []] }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalBills: { $sum: 1 },
            totalDiscount: { $sum: '$discount' },
            totalTax: { $sum: '$tax' },
            avgOrderValue: { $avg: '$total' },
            totalItems: { $sum: { $size: '$items' } }
          }
        }
      ]);
    } catch (error) {
      console.error('Error in paidStats aggregation:', error);
      paidStats = [];
    }

    try {
      // Get payment method breakdown
      paymentStats = await Bill.aggregate([
        {
          $match: {
            createdAt: { $gte: today, $lt: tomorrow },
            status: 'Paid',
            paymentMode: { $exists: true, $ne: null }
          }
        },
        {
          $project: {
            paymentMode: 1,
            total: { $ifNull: ['$total', 0] }
          }
        },
        {
          $group: {
            _id: '$paymentMode',
            count: { $sum: 1 },
            revenue: { $sum: '$total' }
          }
        }
      ]);
    } catch (error) {
      console.error('Error in paymentStats aggregation:', error);
      paymentStats = [];
    }

    try {
      // Get active orders count
      activeOrders = await Bill.countDocuments({
        status: { $in: ['Open', 'Billed'] }
      });
    } catch (error) {
      console.error('Error counting active orders:', error);
      activeOrders = 0;
    }

    try {
      // Get delivery orders count (paid delivery orders today)
      // Only count orders with billType === 'Delivery'
      deliveryStats = await Bill.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
        status: 'Paid',
        billType: 'Delivery'
      });
    } catch (error) {
      console.error('Error counting delivery orders:', error);
      deliveryStats = 0;
    }

    let dineInStats = 0;
    let takeawayStats = 0;

    try {
      // Get dine-in orders count
      dineInStats = await Bill.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
        status: 'Paid',
        billType: 'Dine-In'
      });
    } catch (error) {
      console.error('Error counting dine-in orders:', error);
      dineInStats = 0;
    }

    try {
      // Get takeaway orders count
      takeawayStats = await Bill.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
        status: 'Paid',
        billType: 'Takeaway'
      });
    } catch (error) {
      console.error('Error counting takeaway orders:', error);
      takeawayStats = 0;
    }

    const result = paidStats[0] || { 
      totalRevenue: 0, 
      totalBills: 0, 
      totalDiscount: 0, 
      totalTax: 0,
      avgOrderValue: 0,
      totalItems: 0
    };

    // Ensure paymentStats is an array and filter out null values
    const validPaymentStats = Array.isArray(paymentStats) 
      ? paymentStats.filter(p => p._id !== null && p._id !== undefined)
      : [];

    const response = {
      sales: Number(result.totalRevenue) || 0,
      orders: Number(result.totalBills) || 0,
      averageOrderValue: Math.round(Number(result.avgOrderValue) || 0),
      totalItems: Number(result.totalItems) || 0,
      totalDiscount: Number(result.totalDiscount) || 0,
      totalTax: Number(result.totalTax) || 0,
      paymentMethods: validPaymentStats,
      activeOrders: Number(activeOrders) || 0,
      deliveryOrders: Number(deliveryStats) || 0,
      dineInOrders: Number(dineInStats) || 0,
      takeawayOrders: Number(takeawayStats) || 0
    };
    
    // Cache the result for 30 seconds
    cache.set(cacheKey, response, 30000);
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    console.error('Error stack:', error.stack);
    
    // Always return default response to prevent dashboard failure
    // This ensures the dashboard can still render even if there's an error
    const defaultResponse = {
      sales: 0,
      orders: 0,
      averageOrderValue: 0,
      totalItems: 0,
      totalDiscount: 0,
      totalTax: 0,
      paymentMethods: [],
      activeOrders: 0,
      deliveryOrders: 0
    };
    
    // Log the error but return 200 with default data so dashboard doesn't break
    // The frontend can handle empty/zero data gracefully
    res.status(200).json(defaultResponse);
  }
};

