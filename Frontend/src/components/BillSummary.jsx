import React from 'react';
import { Trash2, Plus, Minus, Save, FileText, CheckCircle, Printer } from 'lucide-react';

// Add global style for hiding scrollbar
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `;
  if (!document.head.querySelector('style[data-scrollbar-hide]')) {
    style.setAttribute('data-scrollbar-hide', 'true');
    document.head.appendChild(style);
  }
}

const BillSummary = ({
   cart,
   updateQuantity,
   subtotal,
   taxAmount,
   discountAmount,
   total,

   // Lifecycle Props
   orderStatus,
   activeTable,
   onSaveOrder,
   onGenerateBill,
   onSettleBill,

   discount,
   setDiscount,
   taxRate,
   setTaxRate,
   billType,
   setBillType,
   loading,

   // Delivery Props
   orderSource,
   setOrderSource
 }) => {
  const isLocked = orderStatus !== 'Open';

  return (
    <div className="flex flex-col h-full bg-surface relative">
      {/* Receipt Top Edge */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_50%,#ffffff_50%)] bg-[length:16px_16px] -mt-2 rotate-180"></div>

      <div className="p-4 border-b-2 border-dashed border-border/50 bg-gradient-to-r from-primary/5 to-accent/5 z-10 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-text-main font-mono tracking-tight">CURRENT ORDER</h2>
          <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5 font-mono">
            <span className="font-bold text-primary">{activeTable}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold ${
              orderStatus === 'Open' ? 'bg-blue-100 text-blue-700' :
              orderStatus === 'Billed' ? 'bg-orange-100 text-orange-700' :
              'bg-green-100 text-green-700'
            }`}>
              {orderStatus}
            </span>
          </div>
        </div>
        <div className="flex bg-background p-0.5 rounded-lg border border-border">
          <button
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${billType === 'Dine-In' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
            onClick={() => !isLocked && setBillType('Dine-In')}
            disabled={isLocked || loading}
          >
            Dine-In
          </button>
          <button
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${billType === 'Takeaway' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
            onClick={() => !isLocked && setBillType('Takeaway')}
            disabled={isLocked || loading}
          >
            Takeaway
          </button>
          <button
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${billType === 'Delivery' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
            onClick={() => !isLocked && setBillType('Delivery')}
            disabled={isLocked || loading}
          >
            Delivery
          </button>
        </div>
      </div>


      <div 
        className={`${billType === 'Delivery' ? 'flex-none hide-scrollbar' : 'flex-1'} overflow-y-auto p-4 space-y-2 bg-[url('https://www.transparenttextures.com/patterns/paper.png')]`}
        style={billType === 'Delivery' ? { 
          height: '17vh', 
          minHeight: '100px'
        } : {}}
      >
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-text-muted/40 space-y-4">
            <div className="w-16 h-16 border-2 border-dashed border-text-muted/30 rounded-full flex items-center justify-center">
              <Plus size={24} />
            </div>
            <p className="font-mono text-xs">ADD ITEMS TO ORDER</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item._id || item.name} className="flex items-center justify-between group p-3 hover:bg-background/50 rounded-lg transition-colors border-b border-dashed border-border/30 last:border-0">
              <div className="flex-1">
                <h4 className="font-bold text-text-main text-sm font-mono">{item.name}</h4>
                <p className="text-xs text-text-muted font-mono">@ ₹{item.price}</p>
              </div>
              
              <div className="flex items-center gap-3 bg-background rounded border border-border px-2 py-1 mx-4 shadow-sm">
                <button 
                  onClick={() => updateQuantity(item._id || item.name, -1)}
                  disabled={isLocked || loading}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-danger hover:text-white text-text-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                </button>
                <span className="text-sm font-bold w-6 text-center font-mono">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item._id || item.name, 1)}
                  disabled={isLocked || loading}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-success hover:text-white text-text-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={12} />
                </button>
              </div>
              
              <div className="font-bold text-text-main w-16 text-right font-mono">
                ₹{item.price * item.quantity}
              </div>
            </div>
          ))
        )}
      </div>

      <div 
        className="flex-none bg-surface border-t-2 border-dashed border-border/50 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-10 relative"
        style={billType !== 'Delivery' ? { height: '45vh' } : {}}
      >
        {/* Receipt Bottom Edge */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_50%,#ffffff_50%)] bg-[length:16px_16px] -mb-2"></div>

        <div className="p-6 space-y-4" style={{ paddingBottom: '125px' }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">Discount</label>
              <div className="flex rounded border border-border overflow-hidden bg-background">
                <select 
                  value={discount.type} 
                  onChange={(e) => setDiscount({...discount, type: e.target.value})}
                  disabled={isLocked || loading}
                  className="bg-background px-2 text-xs focus:outline-none border-r border-border font-mono text-text-main disabled:opacity-50"
                >
                  <option value="percentage">%</option>
                  <option value="flat">₹</option>
                </select>
                <input 
                  type="number" 
                  value={discount.value} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setDiscount({...discount, value: val === '' ? '' : parseFloat(val)})
                  }}
                  disabled={isLocked || loading}
                  className="w-full px-3 py-1.5 text-sm focus:outline-none font-mono text-text-main bg-transparent disabled:opacity-50"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">Tax %</label>
              <input 
                type="number" 
                value={taxRate} 
                onChange={(e) => {
                  const val = e.target.value;
                  setTaxRate(val === '' ? '' : parseFloat(val))
                }}
                disabled={isLocked || loading}
                className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors font-mono text-text-main disabled:opacity-50"
              />
            </div>
          </div>

          {/* Order Source - Only show for Delivery orders */}
          {billType === 'Delivery' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">Order Source</label>
              <select
                value={orderSource}
                onChange={(e) => setOrderSource(e.target.value)}
                disabled={isLocked || loading}
                className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors font-mono text-text-main disabled:opacity-50"
              >
                <option value="Direct">Direct</option>
                <option value="Swiggy">Swiggy</option>
                <option value="Zomato">Zomato</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          <div className="space-y-2 pt-4 border-t-2 border-dashed border-border/50 font-mono">
            <div className="flex justify-between text-sm text-text-muted">
              <span>SUBTOTAL</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-text-muted">
              <span>DISCOUNT</span>
              <span className="text-success">- ₹{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-text-muted">
              <span>TAX ({taxRate}%)</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2 border-text-main">
              <span className="font-bold text-xl text-text-main">TOTAL</span>
              <span className="font-bold text-2xl text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`grid gap-3 mt-4 mb-4 ${billType === 'Delivery' && orderStatus === 'Open' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {orderStatus === 'Open' && (
              <>
                {billType !== 'Delivery' && (
                  <button 
                    onClick={onSaveOrder}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-primary border-2 border-primary/20 hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={18} />
                    {loading ? 'SAVING...' : 'SAVE'}
                  </button>
                )}
                <button 
                  onClick={onGenerateBill}
                  disabled={cart.length === 0 || loading}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText size={18} />
                  {loading ? 'PROCESSING...' : billType === 'Delivery' ? 'MAKE BILL' : 'BILL'}
                </button>
              </>
            )}

            {orderStatus === 'Billed' && (
              <>
                <button 
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-text-main border-2 border-border hover:bg-surface transition-all disabled:opacity-50"
                  disabled={loading}
                >
                  <Printer size={18} />
                  PRINT
                </button>
                <button 
                  onClick={onSettleBill}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-success hover:bg-success-hover shadow-lg shadow-success/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={18} />
                  {loading ? 'SETTLING...' : 'SETTLE'}
                </button>
              </>
            )}

            {orderStatus === 'Paid' && (
              <div className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-success bg-success/10 border border-success/20">
                <CheckCircle size={18} />
                BILL SETTLED
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillSummary;
