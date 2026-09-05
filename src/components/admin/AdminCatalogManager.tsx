import React, { useEffect, useState } from 'react';
import { Image, Pencil, Plus, RefreshCw, Save, Store, Tag, Trash2, X } from 'lucide-react';

type Restaurant = {
  id: string; name: string; descriptionFR: string; descriptionEN: string; logoUrl: string; coverImageUrl: string;
  address: string; neighborhood: string; phone: string; latitude: number; longitude: number; deliveryFee: number;
  estimatedDeliveryTime: string; minOrder: number; isOpen: boolean; isFeatured: boolean; cuisineTypes: string[]; tags: string[];
};
type Category = { id: string; nameFR: string; nameEN: string; imageUrl: string; iconName: string; sortOrder: number; dishCount: number };
type Promotion = { id: string; code: string; titleFR: string; titleEN: string; descriptionFR: string; descriptionEN: string; imageUrl: string; discountType: 'percentage'|'fixed'; discountValue: number; minOrderValue: number; startDate: string; endDate: string; active: boolean };

type Tab = 'restaurants' | 'categories' | 'promotions' | 'settings';
const emptyRestaurant = (): Restaurant => ({ id: '', name: '', descriptionFR: '', descriptionEN: '', logoUrl: '', coverImageUrl: '', address: '', neighborhood: '', phone: '', latitude: 0, longitude: 0, deliveryFee: 0, estimatedDeliveryTime: '25–35 min', minOrder: 0, isOpen: true, isFeatured: false, cuisineTypes: [], tags: [] });
const emptyCategory = (): Category => ({ id: '', nameFR: '', nameEN: '', imageUrl: '', iconName: '', sortOrder: 0, dishCount: 0 });
const emptyPromotion = (): Promotion => ({ id: '', code: '', titleFR: '', titleEN: '', descriptionFR: '', descriptionEN: '', imageUrl: '', discountType: 'percentage', discountValue: 0, minOrderValue: 0, startDate: '', endDate: '', active: true });

export const AdminCatalogManager: React.FC = () => {
  const [tab, setTab] = useState<Tab>('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/catalog', { credentials: 'include', cache: 'no-store' });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || 'Catalog unavailable.');
      setRestaurants(data.restaurants || []); setCategories(data.categories || []); setPromotions(data.promotions || []); setSettings(data.settings || {}); setMessage('');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Impossible de charger le catalogue.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const remove = async (resource: 'restaurants'|'categories'|'promotions', id: string) => {
    if (!window.confirm('Supprimer cet élément définitivement ?')) return;
    const r = await fetch(`/api/admin/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { setMessage(data?.error || 'Suppression impossible.'); return; }
    await load();
  };
  const saveResource = async (resource: 'restaurants'|'categories'|'promotions', value: any) => {
    setSaving(true);
    try {
      const method = value.id ? 'PUT' : 'POST';
      const url = value.id ? `/api/admin/${resource}/${encodeURIComponent(value.id)}` : `/api/admin/${resource}`;
      const r = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item: value }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || 'Enregistrement impossible.');
      setEditing(null); setMessage('Enregistré avec succès.'); await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Enregistrement impossible.'); }
    finally { setSaving(false); }
  };
  const saveSettings = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/settings', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || 'Paramètres non enregistrés.');
      setMessage('Paramètres enregistrés.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Paramètres non enregistrés.'); }
    finally { setSaving(false); }
  };

  const tabs = [
    ['restaurants', 'Restaurants', Store], ['categories', 'Catégories', Tag], ['promotions', 'Promotions', Tag], ['settings', 'Application', Save]
  ] as const;
  return <section className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#F0EDE8] shadow-artistic space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h3 className="font-heading font-black text-lg text-[#2D2D2D]">Administration complète du catalogue</h3><p className="text-xs text-gray-500">Restaurants, catégories, promotions, logo et paramètres de l’application.</p></div>
      <button onClick={() => void load()} className="px-3 py-2 rounded-xl border text-xs font-black inline-flex items-center gap-1.5"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Actualiser</button>
    </div>
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar bg-[#F7F5F0] p-1 rounded-2xl">{tabs.map(([key,label,Icon]) => <button key={key} onClick={() => { setTab(key); setEditing(null); }} className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap inline-flex items-center gap-1.5 ${tab === key ? 'bg-[#006633] text-white' : 'text-gray-600'}`}><Icon className="w-3.5 h-3.5" />{label}</button>)}</div>
    {message && <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-xs font-bold">{message}</div>}
    {tab === 'restaurants' && <ResourceList items={restaurants} title="Restaurants" addLabel="Ajouter un restaurant" onAdd={() => setEditing(emptyRestaurant())} onEdit={setEditing} onDelete={id => void remove('restaurants', id)} render={r => <><b>{r.name}</b><span>{r.neighborhood} · {r.phone || 'Sans téléphone'}</span><span>{r.isOpen ? 'Ouvert' : 'Fermé'} · livraison {(r.deliveryFee || 0).toLocaleString()} FCFA</span></>} />}
    {tab === 'categories' && <ResourceList items={categories} title="Catégories" addLabel="Ajouter une catégorie" onAdd={() => setEditing(emptyCategory())} onEdit={setEditing} onDelete={id => void remove('categories', id)} render={c => <><b>{c.nameFR || c.nameEN}</b><span>{c.nameEN}</span><span>Ordre {c.sortOrder} · {c.dishCount} plats</span></>} />}
    {tab === 'promotions' && <ResourceList items={promotions} title="Promotions" addLabel="Ajouter une promotion" onAdd={() => setEditing(emptyPromotion())} onEdit={setEditing} onDelete={id => void remove('promotions', id)} render={p => <><b>{p.code}</b><span>{p.titleFR || p.titleEN}</span><span>{p.discountType === 'percentage' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString()} FCFA`} · {p.active ? 'Active' : 'Inactive'}</span></>} />}
    {tab === 'settings' && <div className="grid sm:grid-cols-2 gap-4">
      <Setting label="Nom de l’application" value={settings.app_name || 'TerangaEats'} onChange={v => setSettings(s => ({...s, app_name: v}))} />
      <Setting label="WhatsApp Admin" value={settings.admin_whatsapp || '+250726969060'} onChange={v => setSettings(s => ({...s, admin_whatsapp: v}))} />
      <Setting label="Devise" value={settings.default_currency || 'FCFA'} onChange={v => setSettings(s => ({...s, default_currency: v}))} />
      <Setting label="Logo URL" value={settings.app_logo_url || ''} onChange={v => setSettings(s => ({...s, app_logo_url: v}))} />
      <div className="sm:col-span-2 rounded-2xl border p-4 bg-[#FAF8F5]"><p className="text-xs font-black text-gray-500 mb-2">Aperçu du logo</p>{settings.app_logo_url ? <img src={settings.app_logo_url} alt="Logo" className="h-16 w-auto rounded-xl object-contain bg-white p-2" /> : <div className="h-16 flex items-center text-xs text-gray-400">Aucun logo URL défini.</div>}</div>
      <div className="sm:col-span-2 flex justify-end"><button disabled={saving} onClick={() => void saveSettings()} className="px-5 py-2.5 rounded-2xl bg-[#006633] text-white text-xs font-black inline-flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" />{saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}</button></div>
    </div>}
    {editing && tab === 'restaurants' && <RestaurantEditor value={editing} saving={saving} onClose={() => setEditing(null)} onSave={v => void saveResource('restaurants', v)} onChange={setEditing} />}
    {editing && tab === 'categories' && <CategoryEditor value={editing} saving={saving} onClose={() => setEditing(null)} onSave={v => void saveResource('categories', v)} onChange={setEditing} />}
    {editing && tab === 'promotions' && <PromotionEditor value={editing} saving={saving} onClose={() => setEditing(null)} onSave={v => void saveResource('promotions', v)} onChange={setEditing} />}
  </section>;
};

const ResourceList: React.FC<{items:any[];title:string;addLabel:string;onAdd:()=>void;onEdit:(v:any)=>void;onDelete:(id:string)=>void;render:(v:any)=>React.ReactNode}> = ({items,title,addLabel,onAdd,onEdit,onDelete,render}) => <div className="space-y-3"><div className="flex items-center justify-between"><p className="text-sm font-black">{title} ({items.length})</p><button onClick={onAdd} className="px-3.5 py-2 rounded-xl bg-[#006633] text-white text-xs font-black inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />{addLabel}</button></div><div className="grid gap-2">{items.map(item => <div key={item.id} className="rounded-2xl border p-3 flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">{item.logoUrl || item.imageUrl ? <img src={item.logoUrl || item.imageUrl} className="w-full h-full object-cover" /> : <Image className="w-5 h-5 text-gray-400" />}</div><div className="min-w-0 flex-1 text-xs space-y-0.5">{render(item)}</div><button onClick={() => onEdit({...item})} className="p-2 rounded-xl bg-slate-100"><Pencil className="w-4 h-4" /></button><button onClick={() => onDelete(item.id)} className="p-2 rounded-xl bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button></div>)}</div></div>;

const Setting: React.FC<{label:string;value:string;onChange:(v:string)=>void}> = ({label,value,onChange}) => <label className="text-sm font-bold">{label}<input value={value} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-xl border p-3 outline-none focus:border-[#006633]" /></label>;
const Input: React.FC<{label:string;value:any;onChange:(v:any)=>void;type?:string}> = ({label,value,onChange,type='text'}) => <label className="text-xs font-black text-gray-600">{label}<input type={type} value={value ?? ''} onChange={e=>onChange(type === 'number' ? Number(e.target.value) : e.target.value)} className="mt-1 w-full rounded-xl border p-2.5 text-sm font-normal text-gray-900" /></label>;
const Text: React.FC<{label:string;value:string;onChange:(v:string)=>void}> = ({label,value,onChange}) => <label className="text-xs font-black text-gray-600">{label}<textarea value={value || ''} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-xl border p-2.5 text-sm font-normal text-gray-900 min-h-20" /></label>;
const EditorShell: React.FC<{title:string;saving:boolean;onClose:()=>void;onSave:()=>void;children:React.ReactNode}> = ({title,saving,onClose,onSave,children}) => <div className="rounded-2xl border-2 border-emerald-100 bg-[#FAF8F5] p-4"><div className="flex items-center justify-between mb-4"><b className="font-heading">{title}</b><button onClick={onClose} className="p-2 bg-white rounded-xl"><X className="w-4 h-4" /></button></div><div className="grid sm:grid-cols-2 gap-3">{children}</div><div className="flex justify-end mt-4"><button disabled={saving} onClick={onSave} className="px-5 py-2.5 rounded-xl bg-[#006633] text-white text-xs font-black inline-flex items-center gap-2"><Save className="w-4 h-4" />{saving?'Enregistrement…':'Enregistrer'}</button></div></div>;
const RestaurantEditor: React.FC<{value:Restaurant;saving:boolean;onClose:()=>void;onSave:(v:Restaurant)=>void;onChange:(v:Restaurant)=>void}> = ({value,saving,onClose,onSave,onChange}) => <EditorShell title={value.id?'Modifier le restaurant':'Ajouter un restaurant'} saving={saving} onClose={onClose} onSave={()=>onSave(value)}><Input label="Nom" value={value.name} onChange={v=>onChange({...value,name:v})}/><Input label="Téléphone" value={value.phone} onChange={v=>onChange({...value,phone:v})}/><Input label="Quartier" value={value.neighborhood} onChange={v=>onChange({...value,neighborhood:v})}/><Input label="Adresse" value={value.address} onChange={v=>onChange({...value,address:v})}/><Input label="Frais livraison FCFA" type="number" value={value.deliveryFee} onChange={v=>onChange({...value,deliveryFee:v})}/><Input label="Commande minimum FCFA" type="number" value={value.minOrder} onChange={v=>onChange({...value,minOrder:v})}/><Input label="Temps livraison" value={value.estimatedDeliveryTime} onChange={v=>onChange({...value,estimatedDeliveryTime:v})}/><Input label="Logo URL" value={value.logoUrl} onChange={v=>onChange({...value,logoUrl:v})}/><Input label="Cover URL" value={value.coverImageUrl} onChange={v=>onChange({...value,coverImageUrl:v})}/><Text label="Description FR" value={value.descriptionFR} onChange={v=>onChange({...value,descriptionFR:v})}/><Text label="Description EN" value={value.descriptionEN} onChange={v=>onChange({...value,descriptionEN:v})}/><label className="text-xs font-black"><input type="checkbox" checked={value.isOpen} onChange={e=>onChange({...value,isOpen:e.target.checked})} className="mr-2"/>Ouvert</label><label className="text-xs font-black"><input type="checkbox" checked={value.isFeatured} onChange={e=>onChange({...value,isFeatured:e.target.checked})} className="mr-2"/>Featured</label></EditorShell>;
const CategoryEditor: React.FC<{value:Category;saving:boolean;onClose:()=>void;onSave:(v:Category)=>void;onChange:(v:Category)=>void}> = ({value,saving,onClose,onSave,onChange}) => <EditorShell title={value.id?'Modifier la catégorie':'Ajouter une catégorie'} saving={saving} onClose={onClose} onSave={()=>onSave(value)}><Input label="Nom FR" value={value.nameFR} onChange={v=>onChange({...value,nameFR:v})}/><Input label="Nom EN" value={value.nameEN} onChange={v=>onChange({...value,nameEN:v})}/><Input label="Image URL" value={value.imageUrl} onChange={v=>onChange({...value,imageUrl:v})}/><Input label="Icône" value={value.iconName} onChange={v=>onChange({...value,iconName:v})}/><Input label="Ordre" type="number" value={value.sortOrder} onChange={v=>onChange({...value,sortOrder:v})}/></EditorShell>;
const PromotionEditor: React.FC<{value:Promotion;saving:boolean;onClose:()=>void;onSave:(v:Promotion)=>void;onChange:(v:Promotion)=>void}> = ({value,saving,onClose,onSave,onChange}) => <EditorShell title={value.id?'Modifier la promotion':'Ajouter une promotion'} saving={saving} onClose={onClose} onSave={()=>onSave(value)}><Input label="Code" value={value.code} onChange={v=>onChange({...value,code:v.toUpperCase()})}/><Input label="Titre FR" value={value.titleFR} onChange={v=>onChange({...value,titleFR:v})}/><Input label="Titre EN" value={value.titleEN} onChange={v=>onChange({...value,titleEN:v})}/><Input label="Image URL" value={value.imageUrl} onChange={v=>onChange({...value,imageUrl:v})}/><label className="text-xs font-black">Type<select value={value.discountType} onChange={e=>onChange({...value,discountType:e.target.value as 'percentage'|'fixed'})} className="mt-1 w-full rounded-xl border p-2.5 text-sm font-normal"><option value="percentage">Pourcentage</option><option value="fixed">Montant fixe</option></select></label><Input label="Valeur" type="number" value={value.discountValue} onChange={v=>onChange({...value,discountValue:v})}/><Input label="Minimum commande FCFA" type="number" value={value.minOrderValue} onChange={v=>onChange({...value,minOrderValue:v})}/><Input label="Fin (ISO ou date)" value={value.endDate} onChange={v=>onChange({...value,endDate:v})}/><Text label="Description FR" value={value.descriptionFR} onChange={v=>onChange({...value,descriptionFR:v})}/><Text label="Description EN" value={value.descriptionEN} onChange={v=>onChange({...value,descriptionEN:v})}/><label className="text-xs font-black"><input type="checkbox" checked={value.active} onChange={e=>onChange({...value,active:e.target.checked})} className="mr-2"/>Promotion active</label></EditorShell>;
