import React, { useState, useEffect } from 'react';
import { getMenuItems } from '../api/menu';
import { getCategories } from '../api/category';

const formatImageUrl = (url) => {
  if (!url) return '';
  let trimmed = url.trim();

  if (trimmed.includes('google.com/imgres') || trimmed.includes('imgurl=')) {
    try {
      const urlObj = new URL(trimmed);
      const extracted = urlObj.searchParams.get('imgurl');
      if (extracted) trimmed = extracted;
    } catch (e) {
      const match = trimmed.match(/[?&]imgurl=([^&]+)/);
      if (match && match[1]) trimmed = decodeURIComponent(match[1]);
    }
  } else if (trimmed.includes('mediaurl=')) {
    try {
      const urlObj = new URL(trimmed);
      const extracted = urlObj.searchParams.get('mediaurl');
      if (extracted) trimmed = extracted;
    } catch (e) {}
  }

  if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return trimmed;
  }
  if (/^[A-Za-z0-9+/=]{30,}$/.test(trimmed) || trimmed.startsWith('iVBOR') || trimmed.startsWith('/9j/') || trimmed.startsWith('R0lGOD') || trimmed.startsWith('UklGR')) {
    let mime = 'jpeg';
    if (trimmed.startsWith('iVBOR')) mime = 'png';
    else if (trimmed.startsWith('R0lGOD')) mime = 'gif';
    else if (trimmed.startsWith('UklGR')) mime = 'webp';
    return `data:image/${mime};base64,${trimmed}`;
  }
  return trimmed;
};

const MenuGrid = ({ onSelectItem, searchTerm = '' }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const data = await getMenuItems();
      setItems(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setLoading(false);
    }
  };

  const categoryOptions = ['All', ...categories.map(cat => cat.name)];
  
  const filteredItems = items.filter(item => {
    const itemCategory = item.category?.name || item.category;
    const matchesCategory = category === 'All' || itemCategory === category;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading) return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      <div className="p-4 border-b border-border bg-surface z-10 flex flex-col gap-4 shrink-0">
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-6 py-2.5 rounded-full bg-surface-hover animate-pulse">
              <div className="w-16 h-4 bg-text-muted/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-background/50">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl p-5 border border-border/50 animate-pulse">
              <div className="flex justify-between items-start mb-3">
                <div className="w-3/4 h-5 bg-text-muted/20 rounded"></div>
                <div className="w-3 h-3 bg-text-muted/20 rounded-full"></div>
              </div>
              <div className="w-full h-4 bg-text-muted/20 rounded mb-2"></div>
              <div className="w-2/3 h-4 bg-text-muted/20 rounded mb-4"></div>
              <div className="flex items-center justify-between pt-4 border-t border-dashed border-border/50">
                <div className="w-12 h-5 bg-text-muted/20 rounded"></div>
                <div className="w-10 h-10 bg-text-muted/20 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      {/* Top Bar: Categories */}
      <div className="p-4 border-b border-border bg-surface z-10 flex flex-col gap-4 shrink-0">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {categoryOptions.map(cat => (
            <button 
              key={cat}
              className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all transform hover:scale-105 ${
                category === cat 
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 ring-2 ring-primary/20' 
                  : 'bg-background text-text-muted hover:bg-surface-hover hover:text-text-main border border-border'
              }`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      
      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-background/50">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
          {filteredItems.map(item => (
            <div
              key={item._id}
              className="bg-surface rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden flex flex-col h-full border border-border/50 hover:border-primary/20"
              onClick={() => onSelectItem(item)}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 pointer-events-none" />

              {formatImageUrl(item.image) && (
                <div className="w-full h-36 mb-4 rounded-xl overflow-hidden relative shrink-0 bg-background/60 border border-border/40 shadow-sm">
                  <img
                    src={formatImageUrl(item.image)}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.parentElement.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex flex-col h-full justify-between relative z-10">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-text-main leading-tight pr-2 group-hover:text-primary transition-colors">{item.name}</h3>
                    {item.type && (
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ring-2 ring-white ${item.type === 'veg' ? 'bg-success' : 'bg-danger'}`} />
                    )}
                  </div>
                  <p className="text-sm text-text-muted line-clamp-2 leading-relaxed mb-4">{item.description || item.category?.name}</p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-dashed border-border/50">
                  <span className="font-bold text-xl text-text-main">₹{item.price}</span>
                  <button className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg shadow-primary/20 hover:scale-110 hover:bg-primary-hover transform translate-y-2 group-hover:translate-y-0">
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuGrid;
