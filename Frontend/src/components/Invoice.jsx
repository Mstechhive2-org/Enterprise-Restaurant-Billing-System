import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, Download, Save } from 'lucide-react';

const Invoice = ({ bill, onClose, onSave }) => {
  const [settings, setSettings] = useState({
    restaurantName: 'msbillings',
    restaurantType: 'Restaurant',
    address: '123 Foodie Street, Gourmet City',
    phone: '+91 98765 43210',
    email: 'feedback@msbillings.com',
    gstin: '29ABCDE1234F1Z5',
    footerMessage: '*** Thank You! Visit Again ***'
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('restaurantSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);
  const handlePrint = () => {
    if (window.electronAPI && settings.billingPrinter) {
      const htmlContent = document.getElementById('invoice-print-area').outerHTML;
      window.electronAPI.silentPrint(htmlContent, settings.billingPrinter);
    } else {
      window.print();
    }
  };

  return (
    <div id="invoice-print-area" className="invoice-container fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col z-50 overflow-hidden animate-in fade-in duration-200 items-center justify-center p-4 print:p-0.5">
      {/* Controls - Hidden on Print */}
      <div className="absolute top-4 right-4 flex gap-3 print:hidden">
        {onSave && (
          <button 
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-full hover:bg-success-hover transition-colors font-bold shadow-lg shadow-success/20"
          >
            <Save size={18} />
            <span>Finish</span>
          </button>
        )}
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors font-bold shadow-lg"
        >
          <Printer size={18} />
          <span>Print</span>
        </button>
        <button 
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors font-medium backdrop-blur-md"
        >
          <ArrowLeft size={18} />
          <span>Close</span>
        </button>
      </div>


      {/* Receipt Preview */}
      <div className="receipt-print bg-white text-black font-mono w-full max-w-2xl shadow-2xl print:shadow-none border-2 border-black m-10 print:m-0 print:max-w-none print:border-0 overflow-hidden">
        <div className="p-8 print:p-0 print:pb-2">
          {/* Header */}
          <div className="text-center mb-6 print:mb-2 print:mt-1">
            <h1 className="text-2xl print:text-xl font-bold uppercase tracking-wider mb-1">{settings.restaurantName}</h1>
            <div className="text-xs uppercase">
              {settings.address.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            <p className="text-xs uppercase">Ph: {settings.phone}</p>
            <p className="text-xs uppercase mt-1">GSTIN: {settings.gstin}</p>
            <h2 className="text-xl print:text-lg font-bold uppercase tracking-[0.2em] mt-4 print:mt-2 border-y-2 border-dashed border-black py-2 print:py-1">
              {bill.billType === 'Delivery' && bill.orderSource && bill.orderSource !== 'Direct' 
                ? `${bill.orderSource} Order` 
                : 'Receipt'}
            </h2>
          </div>

          {/* Bill Info */}
          <div className="grid grid-cols-2 gap-4 print:gap-2 text-sm uppercase mb-6 print:mb-4 font-bold">
            <div className="space-y-2 print:space-y-1">
              <p className="break-words">BILL NO: {bill.billNumber || 'PREVIEW'}</p>
              <p>DATE: {new Date(bill.createdAt).toLocaleDateString()}</p>
              <p>TIME: {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="space-y-2 print:space-y-1 text-right">
              {bill.billType === 'Delivery' && bill.orderSource && bill.orderSource !== 'Direct' ? (
                <p className="text-orange-600 font-extrabold">{bill.orderSource} ORDER</p>
              ) : (
                <p>TYPE: {bill.billType}</p>
              )}
              <p>TABLE: {bill.tableNo || 'N/A'}</p>
              {bill.customerName && <p className="break-words">CUSTOMER: {bill.customerName}</p>}
            </div>
          </div>

          {/* Separator */}
          <div className="border-b-2 border-dashed border-black mb-2"></div>

          {/* Items Header */}
          <div className="grid grid-cols-[40px_1fr_70px] gap-2 print:gap-1 text-sm font-bold uppercase mb-3">
            <div className="text-center">QTY</div>
            <div>ITEM</div>
            <div className="text-right">PRICE</div>
          </div>

          {/* Items List */}
          <div className="space-y-3 mb-6">
            {bill.items && bill.items.length > 0 ? (
              bill.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[40px_1fr_70px] gap-2 print:gap-1 text-sm uppercase border-b border-dashed border-gray-300 pb-2">
                  <div className="text-center font-bold">{item.quantity || 0}</div>
                  <div className="break-words leading-tight overflow-wrap-anywhere">{item.name || 'Unknown Item'}</div>
                  <div className="text-right font-bold whitespace-nowrap">₹{(item.total || (item.price * item.quantity) || 0).toFixed(2)}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-center text-gray-500 py-4">No items found</div>
            )}
          </div>

          {/* Separator */}
          <div className="border-b-2 border-dashed border-black mb-4"></div>

          {/* Totals */}
          <div className="bg-gray-50 print:bg-transparent p-4 print:p-2 rounded-lg print:rounded-none mb-6 print:mb-4">
            <div className="space-y-2 print:space-y-1 text-sm">
              <div className="flex justify-between font-bold">
                <span>SUBTOTAL</span>
                <span className="whitespace-nowrap">₹{(bill.subtotal || 0).toFixed(2)}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>DISCOUNT</span>
                  <span className="whitespace-nowrap">-₹{(bill.discount || 0).toFixed(2)}</span>
                </div>
              )}
              {bill.tax > 0 && (
                <div className="flex justify-between">
                  <span>TAX</span>
                  <span className="whitespace-nowrap">₹{(bill.tax || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t-2 border-dashed border-black pt-3 print:pt-2 mt-4 print:mt-2">
                <div className="flex justify-between text-xl print:text-lg font-bold uppercase">
                  <span>TOTAL</span>
                  <span className="whitespace-nowrap">₹{(bill.total || 0).toFixed(2)}</span>
                </div>
                {bill.paymentMode && (
                  <div className="text-sm uppercase mt-2 print:mt-1 text-center bg-blue-50 print:bg-transparent p-2 print:p-1 rounded print:rounded-none">
                    Payment: {bill.paymentMode}{bill.paymentMode === 'UPI' && bill.upiApp ? ` (${bill.upiApp})` : ''}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs uppercase space-y-1">
            <p>{settings.footerMessage}</p>
            <p>For Feedback: {settings.email}</p>
          </div>
          
          {/* Cut Line Visual (Screen only) */}
          <div className="mt-8 border-b-4 border-dotted border-gray-300 print:hidden relative">
             <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-black/80 rounded-full"></div>
             <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-black/80 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
