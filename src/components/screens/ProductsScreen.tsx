import React, { useMemo, useState } from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { ProductCard } from '../common/ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { LanguageSelector } from '../common/LanguageSelector';

export const ProductsScreen: React.FC = () => {
  const { language, products, categories, cartCount } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<Product | null>(null);
  const visible = useMemo(() => products.filter(p => {
    if (!p.available || (category !== 'all' && p.categoryId !== category)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const name = language === 'fr' ? p.nameFR : p.nameEN;
    const desc = language === 'fr' ? p.descriptionFR : p.descriptionEN;
    return `${name} ${desc}`.toLowerCase().includes(q);
  }), [products, category, query, language]);

  return <div id="products-screen" className="min-h-screen bg-[#FAF8F5] pb-10">
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-xl border-b border-[#F0EDE8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
        <div><div className="font-heading font-black text-xl text-[#006633]">Teranga<span className="text-[#E8702A]">Eats</span></div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{language === 'fr' ? 'Nos produits' : 'Our products'}</p></div>
        <div className="flex items-center gap-2"><LanguageSelector /><div className="relative w-10 h-10 rounded-2xl bg-white border border-[#F0EDE8] flex items-center justify-center text-[#006633]"><ShoppingBag className="w-4 h-4" />{cartCount > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-[#E8702A] text-white text-[9px] font-black flex items-center justify-center">{cartCount}</span>}</div></div>
      </div>
    </header>
    <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-5 space-y-5">
      <motion.section initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} className="rounded-[30px] bg-gradient-to-r from-[#006633] to-[#0A522A] text-white p-6 sm:p-8 shadow-artistic-lg">
        <p className="text-[#FFCC00] text-[10px] font-black uppercase tracking-[0.18em] mb-2">{language === 'fr' ? 'Bienvenue' : 'Welcome'}</p>
        <h1 className="font-heading text-3xl sm:text-4xl font-black">{language === 'fr' ? 'Découvrez nos produits' : 'Discover our products'}</h1>
        <p className="text-emerald-100 text-sm mt-2">{language === 'fr' ? 'Choisissez ce qui vous fait envie.' : 'Choose what you love.'}</p>
      </motion.section>
      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={language === 'fr' ? 'Rechercher un produit...' : 'Search products...'} className="w-full h-12 rounded-2xl bg-white border border-[#F0EDE8] pl-11 pr-4 text-sm font-medium outline-none focus:border-[#006633]" /></div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={()=>setCategory('all')} className={`shrink-0 px-4 py-2 rounded-full text-xs font-black ${category==='all'?'bg-[#006633] text-white':'bg-white text-gray-500 border border-[#F0EDE8]'}`}>{language==='fr'?'Tous':'All'}</button>
        {categories.map(c=><button key={c.id} onClick={()=>setCategory(c.id)} className={`shrink-0 px-4 py-2 rounded-full text-xs font-black ${category===c.id?'bg-[#006633] text-white':'bg-white text-gray-500 border border-[#F0EDE8]'}`}>{language==='fr'?c.nameFR:c.nameEN}</button>)}
      </div>
      {visible.length ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{visible.map(p=><ProductCard key={p.id} product={p} onSelect={()=>setSelected(p)} />)}</div> : <div className="py-16 text-center text-sm text-gray-400">{language==='fr'?'Aucun produit disponible.':'No products available.'}</div>}
    </main>
    <ProductDetailModal product={selected} onClose={()=>setSelected(null)} />
  </div>;
};
