import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, AlertTriangle, ArrowUpRight, ArrowDownRight, 
  Trash2, Edit3, CheckCircle, RefreshCw, Layers, DollarSign, Clock, 
  Filter, Utensils, ShieldAlert, FileText, ChevronRight
} from 'lucide-react';
import Toast from './Toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
  'X-Tenant-DB': localStorage.getItem('resto_db_name') || ''
});

const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'recipes' | 'logs'
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockCost, setRestockCost] = useState('');
  const [restockNotes, setRestockNotes] = useState('');

  // Form State for Add/Edit Stock Item
  const [formData, setFormData] = useState({
    name: '',
    category: 'Other',
    unit: 'kg',
    currentStock: '',
    minStockAlert: '5',
    unitCost: ''
  });

  // Recipe Mapping State
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState([]);

  const categories = [
    'All', 'Meat & Poultry', 'Grains & Pulses', 'Dairy & Beverages', 
    'Spices & Condiments', 'Vegetables & Fruits', 'Packaging & Supplies', 'Other'
  ];

  const units = ['kg', 'g', 'L', 'ml', 'pcs', 'packs'];

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const [itemsRes, recipesRes, menuRes, logsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/inventory`, { headers: getHeaders() }),
        fetch(`${API_BASE_URL}/inventory/recipes`, { headers: getHeaders() }),
        fetch(`${API_BASE_URL}/menu`, { headers: getHeaders() }),
        fetch(`${API_BASE_URL}/inventory/logs`, { headers: getHeaders() })
      ]);

      if (itemsRes.ok) setItems(await itemsRes.json());
      if (recipesRes.ok) setRecipes(await recipesRes.json());
      if (menuRes.ok) setMenuItems(await menuRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setToast({ message: 'Failed to load inventory data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Add/Edit Submit
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const url = editingItem 
        ? `${API_BASE_URL}/inventory/${editingItem._id}`
        : `${API_BASE_URL}/inventory`;
      
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setToast({ message: `Item ${editingItem ? 'updated' : 'added'} successfully!`, type: 'success' });
        setIsAddModalOpen(false);
        setEditingItem(null);
        resetForm();
        fetchInventoryData();
      } else {
        const err = await res.json();
        setToast({ message: err.message || 'Error saving item', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error occurred', type: 'error' });
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setToast({ message: 'Item deleted', type: 'success' });
        fetchInventoryData();
      }
    } catch (err) {
      setToast({ message: 'Failed to delete item', type: 'error' });
    }
  };

  // Handle Quick Restock (Stock-In)
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockItem || !restockQty) return;

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${restockItem._id}/stock-in`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          quantity: Number(restockQty),
          unitCost: restockCost ? Number(restockCost) : undefined,
          notes: restockNotes || 'Supplier Delivery / Quick Restock'
        })
      });

      if (res.ok) {
        setToast({ message: `Restocked ${restockQty} ${restockItem.unit} of ${restockItem.name}!`, type: 'success' });
        setIsRestockModalOpen(false);
        setRestockItem(null);
        setRestockQty('');
        setRestockCost('');
        setRestockNotes('');
        fetchInventoryData();
      } else {
        const err = await res.json();
        setToast({ message: err.message || 'Restock failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Error restocking item', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Other',
      unit: 'kg',
      currentStock: '',
      minStockAlert: '5',
      unitCost: ''
    });
  };

  // Recipe Selection Handler
  const handleSelectMenuForRecipe = (menuId) => {
    setSelectedMenuId(menuId);
    const existingRecipe = recipes.find(r => (r.menuItem?._id || r.menuItem) === menuId);
    if (existingRecipe && existingRecipe.ingredients) {
      setRecipeIngredients(existingRecipe.ingredients.map(i => ({
        inventoryItem: i.inventoryItem?._id || i.inventoryItem,
        quantity: i.quantity
      })));
    } else {
      setRecipeIngredients([]);
    }
  };

  const handleAddIngredientToRecipe = () => {
    if (items.length === 0) return;
    setRecipeIngredients([...recipeIngredients, { inventoryItem: items[0]._id, quantity: 1 }]);
  };

  const handleRemoveIngredientFromRecipe = (index) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, field, val) => {
    const updated = [...recipeIngredients];
    updated[index][field] = val;
    setRecipeIngredients(updated);
  };

  const handleSaveRecipeMap = async () => {
    if (!selectedMenuId || recipeIngredients.length === 0) {
      setToast({ message: 'Please select a dish and add at least one ingredient', type: 'error' });
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/recipes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          menuItem: selectedMenuId,
          ingredients: recipeIngredients.map(i => ({
            inventoryItem: i.inventoryItem,
            quantity: Number(i.quantity)
          }))
        })
      });

      if (res.ok) {
        setToast({ message: 'Recipe map & dish costing saved successfully!', type: 'success' });
        fetchInventoryData();
      } else {
        const err = await res.json();
        setToast({ message: err.message || 'Error saving recipe', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Error saving recipe', type: 'error' });
    }
  };

  // Calculations
  const totalStockValue = items.reduce((acc, item) => acc + (Number(item.currentStock || 0) * Number(item.unitCost || 0)), 0);
  const lowStockItems = items.filter(item => Number(item.currentStock) <= Number(item.minStockAlert));

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate selected recipe costing
  const selectedMenuObj = menuItems.find(m => m._id === selectedMenuId);
  const totalRecipeCost = recipeIngredients.reduce((acc, ing) => {
    const invItem = items.find(i => i._id === ing.inventoryItem);
    return acc + (invItem ? Number(invItem.unitCost || 0) * Number(ing.quantity || 0) : 0);
  }, 0);
  const dishSellingPrice = selectedMenuObj ? Number(selectedMenuObj.price || 0) : 0;
  const grossProfit = dishSellingPrice - totalRecipeCost;
  const foodCostPercent = dishSellingPrice > 0 ? ((totalRecipeCost / dishSellingPrice) * 100).toFixed(1) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-600 to-amber-700 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="w-8 h-8" /> Inventory & Stock Management
          </h1>
          <p className="text-amber-100 mt-1">
            Track raw ingredients, manage recipe costing, and monitor real-time stock deductions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchInventoryData}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => { resetForm(); setEditingItem(null); setIsAddModalOpen(true); }}
            className="px-4 py-2.5 bg-white text-amber-700 font-bold rounded-xl hover:bg-amber-50 transition shadow flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add Raw Material
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Stock Items</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{items.length}</h3>
          </div>
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <Layers className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
            <h3 className="text-3xl font-bold text-red-600 mt-1">{lowStockItems.length}</h3>
          </div>
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
            <AlertTriangle className={`w-8 h-8 ${lowStockItems.length > 0 ? 'animate-bounce' : ''}`} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Stock Value</p>
            <h3 className="text-3xl font-bold text-emerald-600 mt-1">₹{totalStockValue.toLocaleString()}</h3>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-2xl">
        <button
          onClick={() => setActiveTab('stock')}
          className={`py-4 px-6 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'stock'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="w-4 h-4" /> Stock Room (Raw Materials)
        </button>
        <button
          onClick={() => setActiveTab('recipes')}
          className={`py-4 px-6 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'recipes'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Utensils className="w-4 h-4" /> Recipe Mapping & Costing
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-4 px-6 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'logs'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" /> Stock Audit Logs
        </button>
      </div>

      {/* TAB 1: STOCK ROOM */}
      {activeTab === 'stock' && (
        <div className="bg-white p-6 rounded-b-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search raw ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.slice(0, 6).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                  <th className="p-4 rounded-tl-xl">Item Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Unit Cost</th>
                  <th className="p-4">Total Value</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-400">
                      No inventory items found. Click "+ Add Raw Material" to get started!
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLowStock = Number(item.currentStock) <= Number(item.minStockAlert);
                    return (
                      <tr key={item._id} className="hover:bg-amber-50/30 transition">
                        <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                          {item.name}
                        </td>
                        <td className="p-4 text-gray-600">
                          <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-gray-800">
                          {item.currentStock} {item.unit}
                        </td>
                        <td className="p-4 text-gray-600">₹{Number(item.unitCost || 0).toFixed(2)} / {item.unit}</td>
                        <td className="p-4 font-semibold text-gray-900">
                          ₹{(Number(item.currentStock || 0) * Number(item.unitCost || 0)).toLocaleString()}
                        </td>
                        <td className="p-4">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-full">
                              <CheckCircle className="w-3.5 h-3.5" /> In Stock
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setRestockItem(item);
                              setRestockCost(item.unitCost || '');
                              setIsRestockModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs rounded-lg transition inline-flex items-center gap-1"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" /> Restock
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setFormData({
                                name: item.name,
                                category: item.category,
                                unit: item.unit,
                                currentStock: item.currentStock,
                                minStockAlert: item.minStockAlert,
                                unitCost: item.unitCost
                              });
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-amber-600 transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECIPE MAPPING */}
      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Dish Selector */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-1 space-y-4">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-600" /> 1. Select Dish
            </h3>
            <p className="text-xs text-gray-500">
              Choose a dish from your menu to configure its Bill of Materials (BOM) recipe map.
            </p>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {menuItems.map(dish => {
                const hasRecipe = recipes.some(r => (r.menuItem?._id || r.menuItem) === dish._id);
                const isSelected = selectedMenuId === dish._id;
                return (
                  <button
                    key={dish._id}
                    onClick={() => handleSelectMenuForRecipe(dish._id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/50 shadow-sm'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className={`font-bold text-sm ${isSelected ? 'text-amber-900' : 'text-gray-800'}`}>
                        {dish.name}
                      </p>
                      <p className="text-xs text-gray-500">₹{dish.price} • {dish.category?.name || 'Menu Dish'}</p>
                    </div>
                    {hasRecipe ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">
                        Mapped
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-md">
                        Unmapped
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Ingredients & Costing */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 space-y-6">
            {!selectedMenuId ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 text-gray-400">
                <Utensils className="w-16 h-16 mb-3 opacity-30" />
                <h4 className="font-bold text-gray-700 text-lg">No Dish Selected</h4>
                <p className="text-sm max-w-sm mt-1">
                  Please select a menu dish from the left sidebar to map its raw ingredients and view real-time food costing.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{selectedMenuObj?.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Configure exact quantities deducted automatically when this dish is billed.
                    </p>
                  </div>
                  <button
                    onClick={handleAddIngredientToRecipe}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Ingredient
                  </button>
                </div>

                {/* Ingredients List */}
                <div className="space-y-3">
                  {recipeIngredients.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-xl text-gray-400 text-sm">
                      No ingredients mapped yet. Click "+ Add Ingredient" above!
                    </div>
                  ) : (
                    recipeIngredients.map((ing, idx) => {
                      const invObj = items.find(i => i._id === ing.inventoryItem);
                      const cost = invObj ? Number(invObj.unitCost || 0) * Number(ing.quantity || 0) : 0;
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex-1 w-full">
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Raw Material</label>
                            <select
                              value={ing.inventoryItem}
                              onChange={(e) => handleIngredientChange(idx, 'inventoryItem', e.target.value)}
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold"
                            >
                              {items.map(item => (
                                <option key={item._id} value={item._id}>
                                  {item.name} ({item.unit}) - ₹{item.unitCost}/{item.unit}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="w-full sm:w-36">
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">
                              Qty ({invObj?.unit || 'unit'})
                            </label>
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={ing.quantity}
                              onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold"
                            />
                          </div>
                          <div className="w-full sm:w-28 text-right sm:pt-5 font-bold text-gray-800">
                            ₹{cost.toFixed(2)}
                          </div>
                          <button
                            onClick={() => handleRemoveIngredientFromRecipe(idx)}
                            className="p-2 text-gray-400 hover:text-red-600 sm:pt-5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Costing Summary Card */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl text-white space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                    <span className="text-sm text-gray-400">Menu Selling Price</span>
                    <span className="text-lg font-bold">₹{dishSellingPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                    <span className="text-sm text-gray-400">Total Raw Material Cost</span>
                    <span className="text-lg font-bold text-amber-400">₹{totalRecipeCost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-300 font-semibold block">Gross Profit per Dish</span>
                      <span className="text-xs text-gray-500">Food Cost: {foodCostPercent}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-emerald-400">₹{grossProfit.toFixed(2)}</span>
                      <span className={`block text-xs font-bold mt-0.5 ${
                        Number(foodCostPercent) > 40 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {Number(foodCostPercent) > 40 ? '⚠️ High Food Cost' : '✨ Optimal Margin'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveRecipeMap}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> Save Recipe Map & Costing
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white p-6 rounded-b-2xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-lg text-gray-900">Stock Movement & Audit Trail</h3>
          <p className="text-xs text-gray-500">
            Real-time record of vendor deliveries, kitchen wastage adjustments, and automatic POS billing deductions.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                  <th className="p-4 rounded-tl-xl">Date & Time</th>
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Transaction Type</th>
                  <th className="p-4">Qty Change</th>
                  <th className="p-4">Final Stock</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4 rounded-tr-xl">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-400">
                      No stock movement logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    let badgeClass = 'bg-gray-100 text-gray-700';
                    if (log.type === 'Stock-In') badgeClass = 'bg-emerald-100 text-emerald-700';
                    if (log.type === 'POS Deduction') badgeClass = 'bg-blue-100 text-blue-700';
                    if (log.type === 'Wastage/Adjustment') badgeClass = 'bg-red-100 text-red-700';

                    return (
                      <tr key={log._id} className="hover:bg-gray-50 transition">
                        <td className="p-4 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 font-bold text-gray-900">{log.itemName}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
                            {log.type}
                          </span>
                        </td>
                        <td className={`p-4 font-extrabold ${log.quantityChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {log.quantityChange >= 0 ? `+${log.quantityChange}` : log.quantityChange} {log.unit}
                        </td>
                        <td className="p-4 font-bold text-gray-800">{log.finalStock} {log.unit}</td>
                        <td className="p-4 text-gray-600 text-xs max-w-xs truncate">{log.notes}</td>
                        <td className="p-4 text-gray-500 text-xs">{log.performedBy}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD/EDIT RAW MATERIAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900">
              {editingItem ? 'Edit Raw Material' : 'Add Raw Material'}
            </h3>
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Basmati Rice, Chicken, Cooking Oil"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-sm font-semibold bg-white"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-sm font-semibold bg-white"
                  >
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Initial Stock</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Min Alert Level</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-sm font-bold text-red-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-sm font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow transition"
                >
                  {editingItem ? 'Update Item' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK RESTOCK (STOCK-IN) */}
      {isRestockModalOpen && restockItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ArrowUpRight className="w-6 h-6 text-emerald-600" /> Restock: {restockItem.name}
            </h3>
            <p className="text-xs text-gray-500">
              Current Stock: <strong className="text-gray-800">{restockItem.currentStock} {restockItem.unit}</strong>
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Add Quantity ({restockItem.unit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g., 25"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full p-3 border rounded-xl text-lg font-extrabold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Unit Cost (₹) / {restockItem.unit}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional cost update"
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Notes / Supplier Details</label>
                <input
                  type="text"
                  placeholder="e.g., Metro Cash & Carry Invoice #9821"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow transition flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
