import React, { useEffect, useMemo, useState } from 'react';
import { Bell, DollarSign, LogOut, MapPin, Pencil, Plus, RefreshCw, Search, ShoppingBag, Store, Trash2, Utensils, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus, Product } from '../../types';
import { AdminCatalogManager } from '../admin/AdminCatalogManager';

const emptyProduct = (restaurantId = '', restaurantName = '', categoryId = ''): Omit<Product, 'id' | 'createdAt'> => ({ restaurantId, restaurantName, categoryId, nameFR: '', nameEN: '', descriptionFR: '', descriptionEN: '', imageUrl: '', price: 0, originalPrice: undefined, available: true, rating: 4.9, reviewCount: 0, prepTimeMinutes: 20, isSpicy: false, isPopular: false, isSignature: false, ingredientsFR: [], ingredientsEN: [], options: [] });
const ORDER_FILTERS = ['all','pending','accepted','preparing','ready','assigned','picked_up','delivering','driver_arrived','delivered','cancelled'];
const STATUS_NEXT: Record<string, string[]> = {
  pending: ['accepted', 'cancelled'], accepted: ['preparing', 'cancelled'], preparing: ['ready', 'cancelled'], ready: ['assigned', 'cancelled'],
  assigned: ['picked_up', 'cancelled'], picked_up: ['delivering', 'cancelled'], delivering: ['driver_arrived', 'cancelled'], driver_arrived: ['delivered', 'cancelled'], delivered: [], cancelled: []
};
const canMoveStatus = (current: string, next: string) => current === next || Boolean(STATUS_NEXT[current]?.includes(next));

export const AdminDashboardScreen: React.FC = () => {
  const { t, orders, restaurants, bookings, products, categories, updateOrderStatus, showToast, isSupabaseConnected, syncData, addNewProduct, updateProduct, deleteProduct, toggleProductAvailability } = useApp();
  const [liveOrders, setLiveOrders] = useState<Order[]>(orders);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'createdAt'> | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [notifyingOrderId, setNotifyingOrderId] = useState<string | null>(null);

  useEffect(() => setLiveOrders(orders), [orders]);

  const loadLiveOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders', { credentials: 'include', cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setOrdersError(String(result?.error || `Order feed unavailable (${response.status}).`)); return; }
      if (!Array.isArray(result.orders)) { setOrdersError('Server returned an invalid order feed.'); return; }
      setOrdersError(''); setLiveOrders(result.orders);
    } catch (error) { console.warn('Live admin order feed failed:', error); setOrdersError('Unable to connect to the live order feed.'); }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => { if (!cancelled) await loadLiveOrders(); };
    void run();
    const timer = window.setInterval(run, 3000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  const totalRevenue = liveOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const activeOrdersCount = liveOrders.filter(o => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled').length;
  const visibleOrders = liveOrders.filter(o => selectedStatusFilter === 'all' || o.orderStatus === selectedStatusFilter);
  const visibleProducts = useMemo(() => products.filter(p => `${p.nameFR} ${p.nameEN} ${p.restaurantName}`.toLowerCase().includes(productSearch.toLowerCase())), [products, productSearch]);

  const handleManualSync = async () => { setIsSyncing(true); try { await syncData(); await loadLiveOrders(); showToast('Données synchronisées avec Supabase !'); } finally { setIsSyncing(false); } };
  const startNewProduct = () => { const r = restaurants[0]; setEditingProduct(null); setNewProduct(emptyProduct(r?.id || '', r?.name || '', categories[0]?.id || '')); };
  const save = async () => { setSavingProduct(true); try { if (editingProduct) { if (await updateProduct(editingProduct)) { showToast('Produit mis à jour.'); setEditingProduct(null); } else showToast('Échec de mise à jour du produit.'); } else if (newProduct) { await addNewProduct(newProduct); showToast('Produit ajouté.'); setNewProduct(null); } } catch { showToast('Impossible d’enregistrer le produit.'); } finally { setSavingProduct(false); } };
  const confirmDelete = async (id: string) => { if (!window.confirm('Supprimer ce produit définitivement ?')) return; if (await deleteProduct(id)) showToast('Produit supprimé.'); else showToast('Échec de suppression.'); };
  const handleNotifyOrder = async (orderId: string) => {
    if (notifyingOrderId) return;
    setNotifyingOrderId(orderId);
    try {
      const response = await fetch('/api/admin/notify-order', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) });
      const result = await response.json().catch(() => ({}));
      showToast(result?.notificationSent ? 'WhatsApp Admin envoyé.' : `WhatsApp non envoyé : ${result?.reason || 'vérifiez la session Wasender.'}`);
    } catch { showToast('Impossible de joindre le service WhatsApp.'); }
    finally { setNotifyingOrderId(null); }
  };
  const handleLogout = async () => { try { const response = await fetch('/api/admin/logout', { method: 'POST', credentials: 'include', cache: 'no-store' }); if (!response.ok) { showToast('Impossible de fermer la session.'); return; } window.location.replace('/admin'); } catch { showToast('Impossible de fermer la session.'); } };

  return <div id="admin-dashboard" className="min-h-screen p-4 sm:p-6 pb-28 max-w-7xl mx-auto space-y-6 bg-[#F7F5F0]">
    <div className="bg-gradient-to-r from-[#006633] via-[#0A522A] to-[#1F2937] text-white rounded-[32px] p-6 sm:p-8 shadow-artistic-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-700/30">
      <div><div className="flex items-center gap-2 mb-1.5 flex-wrap"><span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[#FFCC00] text-xs font-black uppercase tracking-wider">👑 Teranga HQ</span><span className="text-xs text-white/80 font-semibold">Admin Control Center</span></div><h2 className="font-heading font-black text-2xl sm:text-3xl text-white">{t('adminDashboardTitle')}</h2><p className="text-xs sm:text-sm text-white/70 mt-1 font-medium">Supervision en temps réel des commandes et de la base de données</p></div>
      <div className="flex items-center gap-2 flex-wrap"><button onClick={handleManualSync} disabled={isSyncing} className="px-3.5 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-black border border-white/30 flex items-center gap-1.5"><RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />Actualiser DB</button><button onClick={handleLogout} className="px-3.5 py-2 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-white text-xs font-black border border-red-300/30 flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" />Déconnexion</button><span className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">● {isSupabaseConnected ? 'Supabase Connecté' : 'Base locale'}</span></div>
    </div>

    {ordersError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><span><strong>Order feed:</strong> {ordersError}</span><button onClick={() => void loadLiveOrders()} className="inline-flex items-center justify-center gap-1 rounded-xl bg-white border border-red-200 px-3 py-1.5 font-bold"><RefreshCw className="w-3.5 h-3.5" />Retry</button></div>}

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Stat label={t('adminTotalSales')} value={`${totalRevenue.toLocaleString()} FCFA`} note="Chiffre d'affaires réel" icon={<DollarSign className="w-4 h-4 text-[#006633]" />} /><Stat label={t('adminTotalOrders')} value={`${liveOrders.length} commandes`} note={`${activeOrdersCount} en cours`} icon={<ShoppingBag className="w-4 h-4 text-amber-700" />} /><Stat label={t('adminActiveRestaurants')} value={`${restaurants.length} partenaires`} note="Restaurants actifs" icon={<Store className="w-4 h-4 text-[#007CB0]" />} /><Stat label="Réservations Tables" value={`${bookings.length} réservées`} note="En direct" icon={<Utensils className="w-4 h-4 text-purple-800" />} /></div>

    <section className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EDE8]"><div><h3 className="font-heading font-black text-lg text-[#2D2D2D]">Flux des commandes en direct</h3><p className="text-xs text-gray-500 font-medium">Nouvelles commandes chargées automatiquement toutes les 3 secondes.</p></div><div className="flex gap-1.5 overflow-x-auto no-scrollbar bg-[#F7F5F0] p-1 rounded-2xl">{ORDER_FILTERS.map(filter => <button key={filter} onClick={() => setSelectedStatusFilter(filter)} className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap ${selectedStatusFilter === filter ? 'bg-[#006633] text-white' : 'text-gray-600'}`}>{filter === 'all' ? 'Toutes' : filter}</button>)}</div></div>
      <div className="space-y-3">{visibleOrders.length === 0 ? <div className="text-center py-10 text-gray-400"><ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-xs font-bold">Aucune commande enregistrée pour ce filtre.</p></div> : visibleOrders.map(order => <div key={order.id} className="p-4 sm:p-5 rounded-[24px] border border-[#F0EDE8] bg-[#FAF8F5] flex flex-col gap-3"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3"><div className="space-y-1.5 min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="font-black text-xs text-[#006633]">{order.id}</span><span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#006633] text-[10px] font-black uppercase">{order.orderStatus}</span><span className="text-xs font-black">{(Number(order.total) || 0).toLocaleString()} FCFA</span></div><p className="text-xs font-bold">{order.customerName} → {order.restaurantName}</p><p className="text-[11px] text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3 text-[#006633]" />{order.deliveryAddress?.neighborhood} ({order.deliveryAddress?.streetAddress})</p></div><div className="flex items-center gap-1.5 flex-wrap"><button onClick={() => void handleNotifyOrder(order.id)} disabled={notifyingOrderId === order.id} className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#E8F8EF] text-[#006633] border border-emerald-200 inline-flex items-center gap-1.5 disabled:opacity-50"><Bell className={`w-3.5 h-3.5 ${notifyingOrderId === order.id ? 'animate-pulse' : ''}`} />{notifyingOrderId === order.id ? 'Envoi…' : 'WhatsApp Admin'}</button>{(['accepted','preparing','ready','assigned','picked_up','delivering','driver_arrived','delivered','cancelled'] as OrderStatus[]).map(st => { const allowed = canMoveStatus(order.orderStatus, st); return <button key={st} disabled={!allowed} title={!allowed ? `Transition impossible : ${order.orderStatus} → ${st}` : undefined} onClick={async () => { if (!allowed) return; await updateOrderStatus(order.id, st); await loadLiveOrders(); }} className={`px-3 py-1.5 rounded-xl text-xs font-black ${order.orderStatus === st ? 'bg-[#006633] text-white' : allowed ? 'bg-white border border-[#F0EDE8] text-gray-700' : 'bg-gray-100 border border-gray-100 text-gray-300 cursor-not-allowed'}`}>{st}</button>; })}</div></div></div>)}</div>
    </section>

    <AdminCatalogManager />

    <section className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h3 className="font-heading font-black text-lg text-[#2D2D2D]">Gestion des produits</h3><p className="text-xs text-gray-500">Ajoutez, modifiez, masquez ou supprimez les plats affichés aux clients.</p></div><button onClick={startNewProduct} className="px-4 py-2.5 rounded-2xl bg-[#006633] text-white text-xs font-black flex items-center gap-2"><Plus className="w-4 h-4" />Ajouter un produit</button></div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Rechercher un produit…" className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm outline-none focus:border-[#006633]" /></div>
      <div className="grid gap-3">{visibleProducts.map(p => <div key={p.id} className="rounded-2xl border border-[#F0EDE8] p-3 flex gap-3 items-center"><img src={p.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=80'} className="w-16 h-16 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="font-black text-sm truncate">{p.nameFR || p.nameEN}</p><p className="text-[11px] text-gray-500 truncate">{p.nameEN} · {p.restaurantName}</p><p className="text-xs font-black text-[#006633] mt-1">{(Number(p.price) || 0).toLocaleString()} FCFA</p></div><button onClick={() => toggleProductAvailability(p.id)} className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black ${p.available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{p.available ? 'Disponible' : 'Masqué'}</button><button onClick={() => setEditingProduct({...p})} className="p-2 rounded-xl bg-slate-100 text-slate-700"><Pencil className="w-4 h-4" /></button><button onClick={() => confirmDelete(p.id)} className="p-2 rounded-xl bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button></div>)}{visibleProducts.length === 0 && <p className="text-center py-8 text-sm text-gray-400">Aucun produit trouvé.</p>}</div>
    </section>

    {(editingProduct || newProduct) && <ProductModal product={editingProduct || newProduct!} categories={categories} restaurants={restaurants} saving={savingProduct} onClose={() => { setEditingProduct(null); setNewProduct(null); }} onSave={save} onChange={p => editingProduct ? setEditingProduct(p as Product) : setNewProduct(p as Omit<Product, 'id' | 'createdAt'>)} />}
  </div>;
};

const Stat: React.FC<{label:string;value:string;note:string;icon:React.ReactNode}> = ({label,value,note,icon}) => <div className="bg-white rounded-[28px] p-5 border border-[#F0EDE8] shadow-artistic"><div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-gray-500">{label}</span>{icon}</div><p className="font-heading font-black text-xl text-[#2D2D2D]">{value}</p><p className="text-[10px] text-[#006633] font-black mt-1">{note}</p></div>;

const ProductModal: React.FC<{product: Product;categories:any[];restaurants:any[];saving:boolean;onClose:()=>void;onSave:()=>void;onChange:(p:Product)=>void}> = ({product,categories,restaurants,saving,onClose,onSave,onChange}) => <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-[28px] p-6 shadow-2xl"><div className="flex items-center justify-between mb-5"><div><h3 className="font-heading font-black text-xl">{product.id ? 'Modifier le produit' : 'Ajouter un produit'}</h3><p className="text-xs text-gray-500">Tous les changements sont enregistrés dans Supabase.</p></div><button onClick={onClose} className="p-2 rounded-xl bg-gray-100"><X className="w-5 h-5" /></button></div><div className="grid sm:grid-cols-2 gap-4"><Field label="Nom FR" value={product.nameFR} onChange={v=>onChange({...product,nameFR:v})}/><Field label="Nom EN" value={product.nameEN} onChange={v=>onChange({...product,nameEN:v})}/><Field label="Prix FCFA" type="number" value={String(product.price)} onChange={v=>onChange({...product,price:Number(v)||0})}/><Field label="Prix original" type="number" value={product.originalPrice == null ? '' : String(product.originalPrice)} onChange={v=>onChange({...product,originalPrice:v?Number(v):undefined})}/><Field label="Image URL" value={product.imageUrl} onChange={v=>onChange({...product,imageUrl:v})}/><Field label="Temps de préparation (min)" type="number" value={String(product.prepTimeMinutes)} onChange={v=>onChange({...product,prepTimeMinutes:Number(v)||0})}/><label className="text-sm font-bold">Restaurant<select value={product.restaurantId} onChange={e=>{const r=restaurants.find((x:any)=>x.id===e.target.value);onChange({...product,restaurantId:e.target.value,restaurantName:r?.name||product.restaurantName});}} className="mt-1 w-full rounded-xl border p-3 bg-white"><option value="">Sélectionner</option>{restaurants.map((r:any)=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label className="text-sm font-bold">Catégorie<select value={product.categoryId} onChange={e=>onChange({...product,categoryId:e.target.value})} className="mt-1 w-full rounded-xl border p-3 bg-white"><option value="">Sélectionner</option>{categories.map((c:any)=><option key={c.id} value={c.id}>{c.nameFR || c.nameEN || c.name}</option>)}</select></label><label className="sm:col-span-2 text-sm font-bold">Description FR<textarea value={product.descriptionFR} onChange={e=>onChange({...product,descriptionFR:e.target.value})} className="mt-1 w-full rounded-xl border p-3 min-h-24"/></label><label className="sm:col-span-2 text-sm font-bold">Description EN<textarea value={product.descriptionEN} onChange={e=>onChange({...product,descriptionEN:e.target.value})} className="mt-1 w-full rounded-xl border p-3 min-h-24"/></label></div><div className="flex flex-wrap gap-4 mt-4"><Check label="Disponible" value={product.available} onChange={v=>onChange({...product,available:v})}/><Check label="Populaire" value={product.isPopular} onChange={v=>onChange({...product,isPopular:v})}/><Check label="Signature" value={product.isSignature} onChange={v=>onChange({...product,isSignature:v})}/><Check label="Épicé" value={product.isSpicy} onChange={v=>onChange({...product,isSpicy:v})}/></div><div className="flex justify-end gap-2 mt-6"><button onClick={onClose} className="px-4 py-2.5 rounded-2xl border text-sm font-bold">Annuler</button><button onClick={onSave} disabled={saving} className="px-5 py-2.5 rounded-2xl bg-[#006633] text-white text-sm font-black disabled:opacity-50">{saving?'Enregistrement…':'Enregistrer'}</button></div></div></div>;

const Field: React.FC<{label:string;value:string;onChange:(v:string)=>void;type?:string}> = ({label,value,onChange,type='text'}) => <label className="text-sm font-bold">{label}<input type={type} value={value} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-xl border p-3 outline-none focus:border-[#006633]" /></label>;
const Check: React.FC<{label:string;value:boolean;onChange:(v:boolean)=>void}> = ({label,value,onChange}) => <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)} />{label}</label>;
