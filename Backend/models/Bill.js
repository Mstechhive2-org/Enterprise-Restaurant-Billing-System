import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  tableNo: {
    type: String,
    required: true
  },
  items: [{
    name: String,
    price: Number,
    quantity: Number,
    printedQuantity: {
      type: Number,
      default: 0
    },
    total: Number
  }],
  subtotal: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Mixed']
  },
  splitPayments: {
    cash: { type: Number, default: 0 },
    upi: { type: Number, default: 0 },
    card: { type: Number, default: 0 }
  },
  upiApp: {
    type: String,
    enum: ['PhonePe', 'GPay', 'Paytm', 'Amazon Pay', 'BharatPe', 'Other']
  },
  status: {
    type: String,
    enum: ['Open', 'Billed', 'Paid', 'Cancelled'],
    default: 'Open'
  },
  billType: {
    type: String,
    enum: ['Dine-In', 'Takeaway', 'Delivery'],
    default: 'Dine-In'
  },
  orderSource: {
    type: String,
    enum: ['Direct', 'Swiggy', 'Zomato', 'Other']
    // No default - only set for Delivery orders
  },
  customerName: String,
  customerPhone: String,
  deliveryAddress: String,
  deliveryInstructions: String,
  deliveryStatus: {
    type: String,
    enum: ['Pending', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  deliveryTime: Date,
  platformOrderId: String, // For Swiggy/Zomato order IDs
  platformCommission: {
    type: Number,
    default: 0
  },
  packagingCharges: {
    type: Number,
    default: 0
  },
  kitchenNotes: String,
  kots: [{
    kotNumber: String,
    items: [{
      name: String,
      quantity: Number
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Add indexes for performance optimization (critical for 150+ orders/day)
billSchema.index({ status: 1, createdAt: -1 }); // For getBills and getOpenOrders
billSchema.index({ tableNo: 1, status: 1 }); // For getActiveOrder
billSchema.index({ createdAt: -1, status: 1 }); // For analytics queries
billSchema.index({ paymentMode: 1, createdAt: -1 }); // For payment method analytics
billSchema.index({ billType: 1, createdAt: -1 }); // For bill type filtering
billSchema.index({ orderSource: 1, createdAt: -1 }); // For delivery platform analytics
billSchema.index({ deliveryStatus: 1, createdAt: -1 }); // For delivery status tracking

export default mongoose.model('Bill', billSchema);
