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
  onPrintKOT,
  onPrintBill,
  onReopenOrder,
  onCancelOrder,

  discount,
  setDiscount,
  taxRate,
  setTaxRate,
  billType,
  setBillType,
  loading,

  // Delivery Props
  orderSource,
  setOrderSource,
  userRole = 'Admin'
}) => {
  const isLocked = orderStatus !== 'Open';
  const isCaptain = userRole === 'Captain';
  let taxSettings = { enableCgst: true, cgstRate: 2.5, enableSgst: true, sgstRate: 2.5, enableGst: false, gstRate: 5 };
  try {
    const s = JSON.parse(localStorage.getItem('restaurantSettings') || '{}');
    taxSettings = { ...taxSettings, ...s };
  } catch (e) {}

  return (
    <div className="flex flex-col h-full bg-surface relative">
      {/* Receipt Top Edge */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_50%,#ffffff_50%)] bg-[length:16px_16px] -mt-2 rotate-180"></div>

      <div className="p-3 sm:p-4 border-b-2 border-dashed border-border/50 bg-gradient-to-r from-primary/5 to-accent/5 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <div className="w-full sm:w-auto flex justify-between sm:block items-center">
          <h2 className="text-xs sm:text-sm font-bold text-text-main font-mono tracking-tight">CURRENT ORDER</h2>
          <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0 sm:mt-0.5 font-mono">
            <span className="font-bold text-primary">{activeTable}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold ${orderStatus === 'Open' ? 'bg-blue-100 text-blue-700' :
                orderStatus === 'Billed' ? 'bg-orange-100 text-orange-700' :
                  'bg-green-100 text-green-700'
              }`}>
              {orderStatus}
            </span>
          </div>
        </div>
        <div className="flex bg-background p-0.5 rounded-lg border border-border w-full sm:w-auto justify-between">
          <button
            className={`flex-1 sm:flex-initial px-2 py-1 rounded-md text-[10px] font-bold transition-all text-center ${billType === 'Dine-In' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
            onClick={() => !isLocked && setBillType('Dine-In')}
            disabled={isLocked || loading}
          >
            Dine-In
          </button>
          <button
            className={`flex-1 sm:flex-initial px-2 py-1 rounded-md text-[10px] font-bold transition-all text-center ${billType === 'Takeaway' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
            onClick={() => !isLocked && setBillType('Takeaway')}
            disabled={isLocked || loading}
          >
            Takeaway
          </button>
          <button
            className={`flex-1 sm:flex-initial px-2 py-1 rounded-md text-[10px] font-bold transition-all text-center ${billType === 'Delivery' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
            onClick={() => !isLocked && setBillType('Delivery')}
            disabled={isLocked || loading}
          >
            Delivery
          </button>
        </div>
      </div>


      <div
        className={`${billType === 'Delivery' ? 'flex-none hide-scrollbar' : 'flex-1'} overflow-y-auto p-2 sm:p-4 space-y-2 bg-background/30 sm:bg-[url('https://www.transparenttextures.com/patterns/paper.png')]`}
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
            <div key={item._id || item.name} className="flex items-center justify-between group p-3 sm:p-3 bg-surface sm:bg-transparent hover:bg-background/50 rounded-xl transition-colors border sm:border-0 border-border/50 sm:border-b sm:border-dashed sm:border-border/30 last:border-0 shadow-xs sm:shadow-none mb-1.5 sm:mb-0">
              <div className="flex-1 pr-2">
                <h4 className="font-bold text-text-main text-sm sm:text-sm font-mono">{item.name}</h4>
                <p className="text-xs text-text-muted font-mono">@ ₹{item.price}</p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 bg-background rounded-xl sm:rounded border border-border px-2 py-1.5 sm:px-2 sm:py-1 mx-2 sm:mx-4 shadow-sm">
                <button
                  onClick={() => updateQuantity(item._id || item.name, -1)}
                  disabled={isLocked || loading}
                  className="w-8 h-8 sm:w-5 sm:h-5 flex items-center justify-center rounded-lg sm:rounded hover:bg-danger hover:text-white text-text-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-surface sm:bg-transparent shadow-sm sm:shadow-none"
                >
                  {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                </button>
                <span className="text-sm sm:text-sm font-bold w-6 text-center font-mono">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item._id || item.name, 1)}
                  disabled={isLocked || loading}
                  className="w-8 h-8 sm:w-5 sm:h-5 flex items-center justify-center rounded-lg sm:rounded hover:bg-success hover:text-white text-text-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-surface sm:bg-transparent shadow-sm sm:shadow-none"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="font-bold text-text-main text-base sm:text-sm w-16 sm:w-16 text-right font-mono">
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
                  onChange={(e) => setDiscount({ ...discount, type: e.target.value })}
                  disabled={isLocked || loading || isCaptain}
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
                    setDiscount({ ...discount, value: val === '' ? '' : parseFloat(val) })
                  }}
                  disabled={isLocked || loading || isCaptain}
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
                disabled={isLocked || loading || isCaptain}
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
            {taxRate > 0 ? (
              (() => {
                const s = taxSettings;
                const cRate = s.enableCgst !== false ? (s.cgstRate !== undefined ? s.cgstRate : 2.5) : 0;
                const sRate = s.enableSgst !== false ? (s.sgstRate !== undefined ? s.sgstRate : 2.5) : 0;
                const gRate = s.enableGst === true ? (s.gstRate !== undefined ? s.gstRate : 5) : 0;
                const tot = cRate + sRate + gRate;
                if (tot === 0) {
                  return (
                    <div className="flex justify-between text-sm text-text-muted">
                      <span>TAX ({taxRate}%)</span>
                      <span>₹{taxAmount.toFixed(2)}</span>
                    </div>
                  );
                }
                const cEff = (parseFloat(taxRate) * (cRate / tot));
                const cAmt = taxAmount * (cRate / tot);
                const sEff = (parseFloat(taxRate) * (sRate / tot));
                const sAmt = taxAmount * (sRate / tot);
                const gEff = (parseFloat(taxRate) * (gRate / tot));
                const gAmt = taxAmount * (gRate / tot);

                return (
                  <>
                    {cRate > 0 && (
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>CGST ({cEff.toFixed(2)}%)</span>
                        <span>₹{cAmt.toFixed(2)}</span>
                      </div>
                    )}
                    {sRate > 0 && (
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>SGST ({sEff.toFixed(2)}%)</span>
                        <span>₹{sAmt.toFixed(2)}</span>
                      </div>
                    )}
                    {gRate > 0 && (
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>GST ({gEff.toFixed(2)}%)</span>
                        <span>₹{gAmt.toFixed(2)}</span>
                      </div>
                    )}
                    {((cRate > 0 && sRate > 0) || ((cRate > 0 || sRate > 0) && gRate > 0)) && (
                      <div className="flex justify-between text-sm font-semibold text-text-main pt-1">
                        <span>TOTAL TAX ({taxRate}%)</span>
                        <span>₹{taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                );
              })()
            ) : null}
            <div className="flex justify-between items-center pt-3 border-t-2 border-text-main">
              <span className="font-bold text-xl text-text-main">TOTAL</span>
              <span className="font-bold text-2xl text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons with pb-24 for mobile bottom nav clearance */}
          <div className={`grid gap-2.5 sm:gap-3 mt-4 mb-4 pb-24 sm:pb-4 ${orderStatus === 'Billed' ? (isCaptain ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-5') : (isCaptain ? 'grid-cols-3' : (billType === 'Delivery' && orderStatus === 'Open' ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'))}`}>
            {orderStatus === 'Open' && (
              <>
                {/* Direct Mobile Pay Option - #1 MOST PROMINENT BUTTON RIGHT UNDER TOTAL */}
                <button 
                  onClick={onSettleBill}
                  disabled={cart.length === 0 || loading}
                  className="col-span-2 sm:hidden flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl font-black text-base tracking-wide text-white bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-700 hover:to-green-600 shadow-xl shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 border-2 border-white/20 animate-pulse-subtle"
                >
                  <CheckCircle size={22} strokeWidth={2.5} />
                  <span>PAY / SETTLE BILL (₹{total.toFixed(0)})</span>
                </button>

                <button 
                  onClick={onPrintKOT}
                  disabled={cart.length === 0 || loading}
                  className="flex flex-col items-center justify-center gap-1.5 sm:gap-1 py-3 sm:py-2 px-2 sm:px-1 rounded-xl font-extrabold text-xs sm:text-[11px] tracking-wider text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
                >
                  <Printer size={20} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                  FIRE KOT
                </button>
                
                <button 
                  onClick={onGenerateBill}
                  disabled={cart.length === 0 || loading}
                  className="flex flex-col items-center justify-center gap-1.5 sm:gap-1 py-3 sm:py-2 px-2 sm:px-1 rounded-xl font-extrabold text-xs sm:text-[11px] tracking-wider text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <FileText size={20} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                  {loading ? 'WAIT' : billType === 'Delivery' ? 'MAKE BILL' : 'BILL'}
                </button>

                {billType !== 'Delivery' && (
                  <button 
                    onClick={onSaveOrder}
                    disabled={loading || cart.length === 0}
                    className="flex flex-col items-center justify-center gap-1.5 sm:gap-1 py-3 sm:py-2 px-2 sm:px-1 rounded-xl font-extrabold text-xs sm:text-[11px] tracking-wider text-primary bg-primary/10 sm:bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
                  >
                    <Save size={20} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                    {loading ? '...' : 'SAVE'}
                  </button>
                )}

                <button 
                  onClick={onCancelOrder}
                  disabled={cart.length === 0 || loading}
                  className="flex flex-col items-center justify-center gap-1.5 sm:gap-1 py-3 sm:py-2 px-2 sm:px-1 rounded-xl font-extrabold text-xs sm:text-[11px] tracking-wider text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
                >
                  <Trash2 size={20} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                  CANCEL
                </button>
              </>
            )}

            {orderStatus === 'Billed' && (
              <>
                <button 
                  onClick={onReopenOrder}
                  className="flex flex-col items-center justify-center gap-1.5 sm:gap-1 py-3 sm:py-2 px-2 sm:px-1 rounded-xl font-extrabold text-xs sm:text-[11px] tracking-wider text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all disabled:opacity-50 shadow-sm active:scale-95"
                  disabled={loading}
                >
                  <Save size={20} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                  EDIT
                </button>
                <button 
                  onClick={onCancelOrder}
                  className="flex flex-col items-center justify-center gap-1.5 sm:gap-1 py-3 sm:py-2 px-2 sm:px-1 rounded-xl font-extrabold text-xs sm:text-[11px] tracking-wider text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50 shadow-sm active:scale-95"
                  disabled={loading}
                >
                  <Trash2 size={20} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                  CANCEL
                </button>
                <button 
                  onClick={onPrintKOT}
                  className="flex flex-col items-center justify-center gap-1.5 sm:gap-1 py-3 sm:py-2 px-2 sm:px-1 rounded-xl font-extrabold text-xs sm:text-[11px] tracking-wider text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-all disabled:opacity-50 shadow-sm active:scale-95"
                  disabled={loading}
                >
                  <Printer size={20} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                  KOT
                </button>
                <button 
                  onClick={onPrintBill}
                  className="flex flex-col items-center justify-center gap-1.5 sm:gap-1 py-3 sm:py-2 px-2 sm:px-1 rounded-xl font-extrabold text-xs sm:text-[11px] tracking-wider text-text-main border border-border hover:bg-surface transition-all disabled:opacity-50 shadow-sm active:scale-95"
                  disabled={loading}
                >
                  <Printer size={20} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                  PRINT
                </button>
                <button 
                  onClick={onSettleBill}
                  disabled={loading}
                  className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 sm:gap-1 sm:flex-col py-3.5 sm:py-2 px-4 sm:px-1 rounded-xl font-black text-sm sm:text-[11px] tracking-wider text-white bg-gradient-to-r sm:bg-none sm:bg-success from-emerald-600 to-green-500 hover:bg-success-hover shadow-lg shadow-success/30 transition-all disabled:opacity-50 active:scale-95"
                >
                  <CheckCircle size={20} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                  <span>{loading ? 'WAIT' : `SETTLE BILL (₹${total.toFixed(0)})`}</span>
                </button>
              </>
            )}

        {orderStatus === 'Paid' && (
          <div className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-success bg-success/10 border border-success/20 pb-24 sm:pb-3">
            <CheckCircle size={18} />
            BILL SETTLED
          </div>
        )}
      </div>
    </div>
      </div >
    </div >
  );
};

export default BillSummary;
