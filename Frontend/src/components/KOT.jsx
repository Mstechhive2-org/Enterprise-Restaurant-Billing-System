import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, Download, Save } from 'lucide-react';

const KOT = ({ order, onClose }) => {
  const [settings, setSettings] = useState({
    restaurantName: 'msbillings',
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('restaurantSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handlePrint = () => {
    if (window.electronAPI && settings.kotPrinter) {
      const htmlContent = document.getElementById('kot-print-area').outerHTML;
      window.electronAPI.silentPrint(htmlContent, settings.kotPrinter);
    } else {
      window.print();
    }
  };

  const isPreview = !order.billNumber && !order._id;

  return (
    <div id="kot-print-area" className="invoice-container fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col z-50 overflow-hidden animate-in fade-in duration-200 items-center justify-center p-4 print:p-0.5">
      {/* Controls - Hidden on Print */}
      <div className="absolute top-4 right-4 flex gap-3 print:hidden">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors font-bold shadow-lg"
        >
          <Printer size={18} />
          <span>Print KOT</span>
        </button>
        <button 
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors font-medium backdrop-blur-md"
        >
          <ArrowLeft size={18} />
          <span>Close</span>
        </button>
      </div>

      {/* KOT Preview */}
      <div className="receipt-print bg-white text-black w-full max-w-sm shadow-2xl print:shadow-none border-2 border-black m-10 print:m-0 print:max-w-none print:border-0 overflow-hidden font-mono">
        <div className="p-6 print:p-0 print:pb-2">
          {/* Header */}
          <div className="text-center mb-4 print:mb-2 print:mt-1">
            <h1 className="text-2xl print:text-xl font-bold uppercase tracking-wider mb-2">{settings.restaurantName}</h1>
            <h2 className="text-xl print:text-lg font-bold uppercase tracking-[0.2em] border-t-2 border-dashed border-black pt-2 print:pt-1">
              K.O.T
            </h2>
            {order.kotNumber && <p className="text-sm font-bold border-b-2 border-dashed border-black pb-2 mb-2">#{order.kotNumber}</p>}
            {!order.kotNumber && <p className="text-sm font-bold border-b-2 border-dashed border-black pb-2 mb-2">(Kitchen Order Ticket)</p>}
          </div>

          {/* Info */}
          <div className="space-y-2 print:space-y-1 text-sm uppercase mb-6 print:mb-4 font-bold border-b-2 border-dashed border-black pb-4">
            <div className="flex justify-between">
              <span>DATE: {new Date(order.createdAt || Date.now()).toLocaleDateString()}</span>
              <span>TIME: {new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between text-base">
              <span>TYPE: {order.billType || order.orderType || 'Dine-In'}</span>
              <span className="font-extrabold text-lg">TABLE: {order.tableNo || 'N/A'}</span>
            </div>
            {order.orderSource && order.orderSource !== 'Direct' && (
              <p className="text-orange-600 font-extrabold">{order.orderSource} ORDER</p>
            )}
            {order.customerName && <p>CUSTOMER: {order.customerName}</p>}
          </div>

          {/* Items Header */}
          <div className="flex justify-between gap-2 print:gap-1 text-sm font-bold uppercase mb-3 border-b-2 border-black pb-1">
            <div className="w-12">QTY</div>
            <div className="flex-1">ITEM</div>
          </div>

          {/* Items List */}
          <div className="space-y-3 mb-6">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between gap-2 print:gap-1 text-base uppercase border-b border-dashed border-gray-300 pb-2">
                  <div className="w-12 font-extrabold text-lg">{item.quantity || 0}</div>
                  <div className="flex-1 break-words leading-tight overflow-wrap-anywhere font-bold text-lg">{item.name || 'Unknown Item'}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-center text-gray-500 py-4">No items found</div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-xs uppercase space-y-1 mt-8 border-t-2 border-dashed border-black pt-4">
            <p>*** END OF KOT ***</p>
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

export default KOT;
