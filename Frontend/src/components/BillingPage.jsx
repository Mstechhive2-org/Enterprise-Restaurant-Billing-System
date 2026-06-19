import React, { useState, useEffect } from 'react';
import MenuGrid from './MenuGrid';
import BillSummary from './BillSummary';
import PaymentModal from './PaymentModal';
import KOT from './KOT';
import Toast from './Toast';
import { getActiveOrder, saveOrder, generateBill, settleBill, apiGenerateKOT, apiReopenOrder, apiCancelOrder } from '../api/billing';
import { Search, UtensilsCrossed, Maximize, Minimize, TrendingUp, ShoppingBag, LayoutGrid } from 'lucide-react';
import useDebounce from '../hooks/useDebounce';
import Invoice from './Invoice';

const BillingPage = ({ initialTable, onOrderUpdate, onNavigate }) => {
  const [activeTable, setActiveTable] = useState(initialTable || '');
  const [floors, setFloors] = useState([]);

  useEffect(() => {
    const savedSpaces = localStorage.getItem('msbillings_spaces');
    if (savedSpaces) {
      let parsed = JSON.parse(savedSpaces);
      if (!Array.isArray(parsed)) {
        parsed = [{
          id: 'f-default',
          name: 'Ground Floor',
          tables: parsed.tables || [],
          cabins: parsed.cabins || [],
          sofas: parsed.sofas || []
        }];
      }
      setFloors(parsed);
    } else {
      setFloors([{
        id: 'f-1',
        name: 'Ground Floor',
        tables: [{ id: 't1', name: 'Table 1' }, { id: 't2', name: 'Table 2' }, { id: 't3', name: 'Table 3' }],
        cabins: [{ id: 'c1', name: 'Cabin 1' }, { id: 'c2', name: 'Cabin 2' }],
        sofas: [{ id: 's1', name: 'Sofa 1' }]
      }]);
    }
  }, []);
  // ... (rest of state)

  // ... (rest of code)

        {/* Table Selector */}
        <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-1.5">
          <LayoutGrid size={16} className="text-text-muted" />
          <select 
            value={activeTable} 
            onChange={(e) => setActiveTable(e.target.value)}
            className="bg-transparent font-bold text-text-main focus:outline-none text-sm"
          >
            <option value="">Select Table</option>
            {[...Array(20)].map((_, i) => (
              <option key={i} value={`TBL-${String(i + 1).padStart(2, '0')}`}>
                Table {String(i + 1).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>
  const [cart, setCart] = useState([]);
  const [orderId, setOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState('Open'); // Open, Billed, Paid
  const [billNumber, setBillNumber] = useState(null);
  
  const [billType, setBillType] = useState('Dine-In');
  const [taxRate, setTaxRate] = useState(''); 
  const [discount, setDiscount] = useState({ type: 'percentage', value: '' });
  
  // Delivery order fields
  const [orderSource, setOrderSource] = useState('Direct');
  
  const [showPayment, setShowPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showKOT, setShowKOT] = useState(false);
  const [activeKOTData, setActiveKOTData] = useState(null);
  const [completedBill, setCompletedBill] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dailyStats, setDailyStats] = useState({ sales: 0, orders: 0 });
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Auto-generate delivery order number when Delivery is selected
  useEffect(() => {
    if (billType === 'Delivery' && !activeTable) {
      const timestamp = Date.now().toString().slice(-6);
      const generatedOrderNo = `DEL-${timestamp}`;
      setActiveTable(generatedOrderNo);
    } else if (billType !== 'Delivery' && activeTable && activeTable.startsWith('DEL-')) {
      setActiveTable('');
    }
  }, [billType]);

  // Fetch active order when table changes
  useEffect(() => {
    if (activeTable) {
      fetchActiveOrder();
    }
  }, [activeTable]);

  useEffect(() => {
    fetchDailyStats();
  }, []);

  const fetchActiveOrder = async () => {
    if (!activeTable) return;
    setLoading(true);
    try {
      const order = await getActiveOrder(activeTable);
      if (order) {
        setCart(order.items);
        setOrderId(order._id);
        setOrderStatus(order.status);
        setBillNumber(order.billNumber);
        setBillType(order.billType || 'Dine-In');
        // Restore delivery fields if delivery order
        if (order.billType === 'Delivery') {
          setOrderSource(order.orderSource || 'Direct');
        }
      } else {
        // Reset for new order
        setCart([]);
        setOrderId(null);
        setOrderStatus('Open');
        setBillNumber(null);
        if (billType !== 'Delivery') {
          setOrderSource('Direct');
        }
      }
    } catch (error) {
      console.error('Error fetching active order:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const { getDailyStats } = await import('../api/billing');
      const stats = await getDailyStats();
      setDailyStats(stats);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      // Fallback to 0 if API fails
      setDailyStats({ sales: 0, orders: 0 });
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const addToCart = (item) => {
    if (!activeTable) {
      showToast('Please select a table first', 'error');
      return;
    }
    if (orderStatus !== 'Open') {
      showToast('Order is locked. Cannot add items.', 'error');
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.name === item.name); // Match by name for now, ideally ID
      if (existing) {
        showToast(`Increased quantity for ${item.name}`, 'success');
        return prev.map(i => i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i);
      }
      showToast(`Added ${item.name} to order`, 'success');
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    if (!activeTable) {
      showToast('Please select a table first', 'error');
      return;
    }
    if (orderStatus !== 'Open') {
      showToast('Order is locked. Cannot modify items.', 'error');
      return;
    }
    setCart(prev => prev.map(i => {
      if (i._id === id || i.name === id) { // Handle both ID and Name matching
        const newQty = Math.max(0, i.quantity + delta);
        if (newQty === 0) showToast(`${i.name} removed from order`, 'info');
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const calculateSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const calculateDiscount = (subtotal) => {
    const val = discount.value === '' ? 0 : parseFloat(discount.value) || 0;
    if (discount.type === 'percentage') {
      return (subtotal * val) / 100;
    }
    return val;
  };

  const subtotal = calculateSubtotal();
  const discountAmount = calculateDiscount(subtotal);
  const taxableAmount = subtotal - discountAmount;
  const taxVal = taxRate === '' ? 0 : parseFloat(taxRate) || 0;
  const taxAmount = (taxableAmount * taxVal) / 100;
  const total = Math.round(taxableAmount + taxAmount);

  // Action Handlers
  const handleSaveOrder = async () => {
    if (!activeTable) {
      if (billType === 'Delivery') {
        // Auto-generate delivery order number if not set
        const timestamp = Date.now().toString().slice(-6);
        const generatedOrderNo = `DEL-${timestamp}`;
        setActiveTable(generatedOrderNo);
        // Wait a bit for state to update, then proceed
        setTimeout(() => handleSaveOrderWithTable(generatedOrderNo), 100);
        return;
      } else {
        showToast('Please select a table first', 'error');
        return;
      }
    }
    handleSaveOrderWithTable(activeTable);
  };

  const handleSaveOrderWithTable = async (tableNo) => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const orderData = {
        tableNo: tableNo,
        items: cart,
        billType,
        // Include delivery fields if delivery order
        ...(billType === 'Delivery' && {
          orderSource
        })
      };
      const savedOrder = await saveOrder(orderData);
      setOrderId(savedOrder._id);
      setActiveTable(tableNo); // Ensure table is set
      showToast('Order saved successfully!', 'success');
      fetchActiveOrder();
      if (onOrderUpdate) onOrderUpdate();
    } catch (error) {
      console.error('Error saving order:', error);
      const errorMessage = error.response?.data?.message || error.message;
      const errorDetails = error.response?.data?.details ? JSON.stringify(error.response.data.details) : '';
      showToast(`Failed to save order: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async () => {
    // For Delivery orders, auto-save if order doesn't exist
    if (!orderId) {
      if (billType === 'Delivery') {
        // Auto-generate delivery order number if not set
        let tableToUse = activeTable;
        if (!tableToUse) {
          const timestamp = Date.now().toString().slice(-6);
          tableToUse = `DEL-${timestamp}`;
          setActiveTable(tableToUse);
        }
        // Save order first, then generate bill
        setLoading(true);
        try {
          const orderData = {
            tableNo: tableToUse,
            items: cart,
            billType: 'Delivery',
            orderSource
          };
          const savedOrder = await saveOrder(orderData);
          setOrderId(savedOrder._id);
          // Now generate bill with the saved order
          await generateBillAfterSave(savedOrder._id);
        } catch (error) {
          console.error('Error saving delivery order:', error);
          const errorMessage = error.response?.data?.message || error.message;
          showToast(`Failed to save order: ${errorMessage}`, 'error');
          setLoading(false);
        }
        return;
      } else {
        showToast('Please save the order first.', 'error');
        return;
      }
    }
    
    // Generate bill for existing order
    await generateBillAfterSave(orderId);
  };

  const generateBillAfterSave = async (orderIdToUse) => {
    setLoading(true);
    try {
      const billData = {
        discount: discountAmount,
        tax: taxVal
      };
      const billedOrder = await generateBill(orderIdToUse, billData);
      setOrderId(billedOrder._id);
      setOrderStatus('Billed');
      setBillNumber(billedOrder.billNumber);
      setCompletedBill(billedOrder);
      
      showToast('Bill generated successfully!', 'success');
      if (onOrderUpdate) onOrderUpdate();
      // Open Payment Modal immediately after generating bill
      setShowPayment(true);
    } catch (error) {
      console.error('Error generating bill:', error);
      
      // Graceful handling for "Order already billed" (e.g. double click or network retry)
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already billed')) {
         try {
           const order = await getActiveOrder(activeTable);
           if (order && (order.status === 'Billed' || order.status === 'Paid')) {
              setOrderStatus(order.status);
              setBillNumber(order.billNumber);
              setCompletedBill(order);
              if (order.status === 'Billed') {
                setShowPayment(true);
              } else {
                setShowInvoice(true);
              }
              showToast('Recovered existing bill status.', 'info');
              return;
           }
         } catch (fetchError) {
           console.error('Error recovering order state:', fetchError);
         }
      }

      const errorMessage = error.response?.data?.message || error.message;
      showToast(`Failed to generate bill: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSettleBill = (paymentData) => {
    completeSettlement(paymentData);
  };

  const completeSettlement = async (paymentData) => {
    setLoading(true);
    try {
      const settledOrder = await settleBill(orderId, { 
        paymentMode: paymentData.mode,
        splitPayments: paymentData.splitPayments,
        upiApp: paymentData.upiApp
      });
      setOrderStatus('Paid');
      setShowPayment(false);
      
      // Update completed bill with paid status and all details
      // The bill is now saved to billing history (status: 'Paid')
      setCompletedBill({ 
        ...settledOrder, 
        items: cart, // Ensure items are preserved
        status: 'Paid', // Explicitly set status
        paymentMode: paymentData.mode // Ensure payment mode is set
      });
      
      showToast('Bill Settled Successfully! Saved to billing history.', 'success');
      fetchDailyStats();
      if (onOrderUpdate) onOrderUpdate();
      setShowInvoice(true); // Show Invoice AFTER payment
    } catch (error) {
      console.error('Error settling bill:', error);
      setToast({ message: error.response?.data?.message || 'Failed to settle bill', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintKOT = async () => {
    try {
      setLoading(true);
      // Ensure order is saved first
      const orderData = {
        tableNo: activeTable,
        items: cart,
        subtotal,
        tax: taxAmount,
        discount: discountAmount,
        total,
        billType,
        orderSource: billType === 'Delivery' ? orderSource : undefined
      };
      
      let currentId = orderId;
      if (!currentId) {
         const savedOrder = await saveOrder(orderData);
         currentId = savedOrder._id;
         setOrderId(savedOrder._id);
      } else {
         await saveOrder({ id: currentId, ...orderData });
      }

      // Generate Delta KOT
      const response = await apiGenerateKOT(currentId, cart);
      
      // Update local cart state to reflect printed quantity
      if (response.bill && response.bill.items) {
        setCart(response.bill.items);
      }

      setActiveKOTData({
        ...response.kot,
        tableNo: activeTable,
        billType,
        orderSource
      });
      setShowKOT(true);
      
    } catch (error) {
      console.error('Error generating KOT:', error);
      showToast(error.response?.data?.message || 'Failed to generate KOT', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    // Verify bill is saved before closing
    if (completedBill && completedBill.status === 'Paid') {
      // Bill is already saved to history (status is 'Paid')
      // Show confirmation message
      showToast(`Bill ${completedBill.billNumber || 'saved'} has been saved to billing history!`, 'success');
    }
    
    // Close invoice and reset state
    setShowInvoice(false);
    setCart([]);
    setOrderId(null);
    setOrderStatus('Open');
    setBillNumber(null);
    setCompletedBill(null);
    fetchActiveOrder(); // Refresh to ensure clean state
    
    // Refresh daily stats to reflect the new bill
    fetchDailyStats();
    
    // Notify parent component to refresh active orders
    if (onOrderUpdate) onOrderUpdate();

    // Redirect to floor management after finishing the bill
    if (onNavigate) {
      onNavigate('floor');
    }
  };

  const handleReopenOrder = async () => {
    try {
      setLoading(true);
      await apiReopenOrder(orderId);
      setOrderStatus('Open');
      showToast('Order reopened successfully', 'success');
      if (onOrderUpdate) onOrderUpdate();
    } catch (error) {
      console.error('Error reopening order:', error);
      showToast(error.response?.data?.message || 'Failed to reopen order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId) {
      // Just clear local cart
      setCart([]);
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this order completely?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiCancelOrder(orderId);
      
      if (response.kot) {
        // Show cancellation KOT
        setActiveKOTData({
          ...response.kot,
          tableNo: activeTable,
          billType,
          orderSource
        });
        setShowKOT(true);
      }

      showToast('Order cancelled successfully', 'success');
      
      // Reset state
      setCart([]);
      setOrderId(null);
      setOrderStatus('Open');
      setBillNumber(null);
      
      if (onOrderUpdate) onOrderUpdate();
    } catch (error) {
      console.error('Error cancelling order:', error);
      showToast(error.response?.data?.message || 'Failed to cancel order', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Custom Header for Billing Page */}
      <div className="h-16 flex items-center justify-between px-6 bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 border-b border-border shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 font-bold text-xl text-primary">
          <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <UtensilsCrossed size={18} />
          </div>
          <span className="tracking-tight">msbillings</span>
        </div>

        {/* Table Selector */}
        <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-1.5">
          <LayoutGrid size={16} className="text-text-muted" />
          {billType === 'Delivery' ? (
            <div className="font-bold text-text-main text-sm">
              {activeTable || 'DEL-XXXXXX'}
            </div>
          ) : (
            <select 
              value={activeTable} 
              onChange={(e) => setActiveTable(e.target.value)}
              className="bg-transparent font-bold text-text-main focus:outline-none text-sm"
            >
              <option value="" >Select Table</option>
              {floors.map(floor => {
                const hasItems = floor.tables?.length > 0 || floor.cabins?.length > 0 || floor.sofas?.length > 0;
                if (!hasItems) return null;
                return (
                  <optgroup key={floor.id} label={floor.name}>
                    {floor.tables?.map(t => <option key={`t-${t.id}`} value={t.name}>{t.name} (Table)</option>)}
                    {floor.cabins?.map(c => <option key={`c-${c.id}`} value={c.name}>{c.name} (Cabin)</option>)}
                    {floor.sofas?.map(s => <option key={`s-${s.id}`} value={s.name}>{s.name} (Sofa)</option>)}
                  </optgroup>
                );
              })}
              {/* Fallback to default tables if completely empty */}
              {floors.length === 0 && [...Array(20)].map((_, i) => (
                <option key={i} value={`TBL-${String(i + 1).padStart(2, '0')}`}>
                  Table {String(i + 1).padStart(2, '0')}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex-1 max-w-md mx-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 text-text-main transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-background px-3 py-1.5 rounded-xl border border-border/50">
            <div className="flex flex-col items-end">
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider flex items-center gap-1">
                Sales <TrendingUp size={10} className="text-success" />
              </p>
              <p className="text-sm font-bold text-text-main font-mono">₹{dailyStats.sales.toLocaleString()}</p>
            </div>
          </div>
          
          <button 
            onClick={toggleFullScreen}
            className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
          >
            {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        <div className="flex-1 grid grid-cols-[1fr_400px] gap-4 overflow-hidden">
          {/* Left Panel: Menu */}
          <div className="flex flex-col overflow-hidden bg-surface rounded-2xl shadow-sm border border-border/50">
            <MenuGrid onSelectItem={addToCart} searchTerm={debouncedSearchTerm} />
          </div>

          {/* Right Panel: Summary */}
          <div className="flex flex-col overflow-hidden rounded-2xl shadow-xl shadow-primary/5 ring-1 ring-black/5 bg-surface">
            <BillSummary
              cart={cart}
              updateQuantity={updateQuantity}
              subtotal={subtotal}
              taxAmount={taxAmount}
              discountAmount={discountAmount}
              total={total}

              // Lifecycle Props
              orderStatus={orderStatus}
              activeTable={activeTable}
              onSaveOrder={handleSaveOrder}
              onGenerateBill={handleGenerateBill}
              onSettleBill={() => setShowPayment(true)}
              onPrintKOT={handlePrintKOT}
              onReopenOrder={handleReopenOrder}
              onCancelOrder={handleCancelOrder}

              discount={discount}
              setDiscount={setDiscount}
              taxRate={taxRate}
              setTaxRate={setTaxRate}
              billType={billType}
              setBillType={setBillType}
              loading={loading}

              // Delivery Props
              orderSource={orderSource}
              setOrderSource={setOrderSource}
            />
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal 
          total={total} 
          onClose={() => setShowPayment(false)} 
          onComplete={handleSettleBill}
        />
      )}

      {showInvoice && (
        <Invoice 
          bill={completedBill} 
          onClose={handleFinish} 
          onSave={handleFinish} // Re-using onSave prop for "Finish" action
        />
      )}

      {showKOT && activeKOTData && (
        <KOT 
          order={activeKOTData}
          onClose={() => {
            setShowKOT(false);
            setActiveKOTData(null);
          }}
        />
      )}

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

export default BillingPage;
