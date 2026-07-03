const fs = require('fs');

// 1. Fix api/expenses.js
let expApi = fs.readFileSync('Frontend/src/api/expenses.js', 'utf8');
expApi = expApi.replace("import axios from 'axios';", "import api from './axios';");
expApi = expApi.replace(/axios\.get/g, "api.get");
expApi = expApi.replace(/axios\.post/g, "api.post");
expApi = expApi.replace(/axios\.delete/g, "api.delete");
fs.writeFileSync('Frontend/src/api/expenses.js', expApi);

// 2. Fix App.jsx Floor Management Icon
let appJsx = fs.readFileSync('Frontend/src/App.jsx', 'utf8');
appJsx = appJsx.replace(/Home, Settings as SettingsIcon/, "LayoutGrid, Home, Settings as SettingsIcon");
appJsx = appJsx.replace(/<Home size=\{20\} \/>\n\s*<span>Floor Management<\/span>/, "<LayoutGrid size={20} />\n            <span>Floor Management</span>");
fs.writeFileSync('Frontend/src/App.jsx', appJsx);

// 3. Fix MenuManagement.jsx Search Bar Debounce & Pagination
let menuJsx = fs.readFileSync('Frontend/src/components/MenuManagement.jsx', 'utf8');
if (!menuJsx.includes('useEffect(() => {\n    setCurrentPage(1);\n  }, [searchTerm]);')) {
    menuJsx = menuJsx.replace("const [currentPage, setCurrentPage] = useState(1);", "const [currentPage, setCurrentPage] = useState(1);\n\n  useEffect(() => {\n    setCurrentPage(1);\n  }, [searchTerm]);");
}
fs.writeFileSync('Frontend/src/components/MenuManagement.jsx', menuJsx);

// 4. Fix Invoice.jsx Layout
let invoiceJsx = fs.readFileSync('Frontend/src/components/Invoice.jsx', 'utf8');
invoiceJsx = invoiceJsx.replace(
`<div className="grid grid-cols-[1fr_30px_45px_50px] gap-1 text-[12px] print:text-[12px] font-bold uppercase text-black">
              <div>ITEM</div>
              <div className="text-center">QTY</div>
              <div className="text-right">RATE</div>
              <div className="text-right">TOTAL</div>
            </div>`,
`<div className="flex justify-between gap-1 text-[14px] print:text-[14px] font-[900] uppercase text-black">
              <div className="flex-1">ITEM</div>
              <div className="text-right">TOTAL</div>
            </div>`
);
invoiceJsx = invoiceJsx.replace(
`<div className="mb-1">
            {bill.items && bill.items.length > 0 ? (
              bill.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_30px_45px_50px] gap-1 text-[12px] print:text-[12px] font-bold uppercase text-black pb-1 leading-tight">
                  <div className="break-words">{item.name || 'Unknown Item'}</div>
                  <div className="text-center">{item.quantity || 0}</div>
                  <div className="text-right">{item.price || 0}</div>
                  <div className="text-right">{(item.total || (item.price * item.quantity) || 0).toFixed(0)}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-center text-black font-bold py-2">No items</div>
            )}
          </div>`,
`<div className="mb-1 border-b-2 border-dashed border-black pb-2">
            {bill.items && bill.items.length > 0 ? (
              bill.items.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-0.5 text-[14px] print:text-[14px] font-[900] uppercase text-black pb-2 pt-1 border-b border-dotted border-gray-400 last:border-0 leading-tight">
                  <div className="break-words">{item.name || 'Unknown Item'}</div>
                  <div className="flex justify-between text-[13px] print:text-[13px] text-gray-800">
                    <div>{item.quantity || 0} x Rs {(item.price || 0).toFixed(2)}</div>
                    <div>Rs {(item.total || (item.price * item.quantity) || 0).toFixed(2)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-center text-black font-bold py-2">No items</div>
            )}
          </div>`
);
fs.writeFileSync('Frontend/src/components/Invoice.jsx', invoiceJsx);

// 5. Fix Dashboard cache in Backend/controllers/billController.js
let billCtrl = fs.readFileSync('Backend/controllers/billController.js', 'utf8');
billCtrl = billCtrl.replace(
`    // Cache the result for 30 seconds
    cache.set(cacheKey, response, 30000);`,
`    // Cache removed to ensure immediate reflection on dashboard
    // cache.set(cacheKey, response, 30000);`
);
// Also disable reading from cache
billCtrl = billCtrl.replace(
`    // Check cache first (30 second TTL for real-time feel)
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }`,
`    // Cache checking disabled
    // const cached = cache.get(cacheKey);
    // if (cached) {
    //   return res.json(cached);
    // }`
);
fs.writeFileSync('Backend/controllers/billController.js', billCtrl);

console.log('All fixes applied successfully');
