import React, { useMemo, useState } from 'react';
import { Product, SelectedOption } from '../../types';
import { useApp } from '../../context/AppContext';
import { Primary3DButton } from '../common/Primary3DButton';
import { Clock, Flame, Minus, Plus, ShoppingBag, Star, X } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

const ProductDetailContent: React.FC<{ product: Product; onClose: () => void }> = ({ product, onClose }) => {
  const { t, language, addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [spicy, setSpicy] = useState<'mild' | 'medium' | 'spicy'>('medium');

  const name = language === 'fr' ? product.nameFR : product.nameEN;
  const desc = language === 'fr' ? product.descriptionFR : product.descriptionEN;
  const ingredients = language === 'fr' ? product.ingredientsFR : product.ingredientsEN;
  const unitPrice = useMemo(() => product.price + selectedOptions.reduce((sum, o) => sum + o.price, 0), [product.price, selectedOptions]);
  const totalPrice = unitPrice * quantity;

  const toggleOption = (group: any, choice: any) => {
    setSelectedOptions(prev => group.maxSelections === 1
      ? [...prev.filter(o => o.groupId !== group.id), { groupId: group.id, groupName: group.nameFR, choiceId: choice.id, choiceName: choice.nameFR, price: choice.price }]
      : prev.some(o => o.groupId === group.id && o.choiceId === choice.id)
        ? prev.filter(o => !(o.groupId === group.id && o.choiceId === choice.id))
        : [...prev, { groupId: group.id, groupName: group.nameFR, choiceId: choice.id, choiceName: choice.nameFR, price: choice.price }]
    );
  };

  const add = () => {
    addToCart({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      product,
      restaurantId: product.restaurantId,
      restaurantName: product.restaurantName,
      quantity,
      selectedOptions,
      specialInstructions: `${specialInstructions} [Piment: ${spicy}]`.trim(),
      unitPrice,
      totalPrice,
    });
    onClose();
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
    <motion.div initial={{ opacity: 0, scale: .96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white w-full max-w-lg rounded-[36px] overflow-hidden shadow-artistic-lg max-h-[92vh] flex flex-col my-auto">
      <div className="relative h-56 sm:h-64 shrink-0">
        <img src={product.imageUrl} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center"><X className="w-5 h-5" /></button>
        <div className="absolute bottom-4 left-4 right-4 text-white"><span className="text-[10px] font-black uppercase text-[#FFCC00]">{product.restaurantName}</span><h3 className="font-heading text-2xl font-black mt-1">{name}</h3></div>
      </div>
      <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EDE8]"><span className="text-2xl font-extrabold text-[#006633]">{product.price.toLocaleString()} FCFA</span><div className="flex gap-3 text-xs text-gray-500"><span className="flex items-center gap-1"><Star className="w-4 h-4 fill-[#FFCC00] text-[#FFCC00]" />{product.rating.toFixed(1)}</span><span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />~{product.prepTimeMinutes} min</span></div></div>
        <div><h4 className="text-xs font-black uppercase mb-1">Description</h4><p className="text-xs text-gray-500 leading-relaxed">{desc}</p>{ingredients?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{ingredients.map((x, i) => <span key={i} className="px-2.5 py-1 rounded-xl bg-[#F7F5F0] text-[11px] font-bold">{x}</span>)}</div>}</div>
        {product.options?.map((group: any) => <div key={group.id} className="pt-3 border-t border-[#F0EDE8] space-y-2"><div className="flex justify-between"><h4 className="text-xs font-black uppercase">{language === 'fr' ? group.nameFR : group.nameEN}</h4>{group.required && <span className="text-[10px] text-red-600 font-black">Obligatoire</span>}</div>{group.choices.map((choice: any) => { const selected = selectedOptions.some(o => o.groupId === group.id && o.choiceId === choice.id); return <button key={choice.id} type="button" onClick={() => toggleOption(group, choice)} className={`w-full p-3 rounded-2xl border text-xs font-bold flex justify-between ${selected ? 'bg-emerald-50 border-[#006633] text-[#006633]' : 'bg-[#F7F5F0] border-[#F0EDE8]'}`}><span>{language === 'fr' ? choice.nameFR : choice.nameEN}</span>{choice.price > 0 && <span>+{choice.price.toLocaleString()} FCFA</span>}</button>; })}</div>)}
        <div className="pt-3 border-t border-[#F0EDE8]"><h4 className="text-xs font-black uppercase flex items-center gap-1 mb-2"><Flame className="w-3.5 h-3.5 text-[#E8702A]" />{t('spicyLevel')}</h4><div className="grid grid-cols-3 gap-2">{[['mild','Doux','🌿'],['medium','Moyen','🌶️'],['spicy','Pimenté','🔥']].map(([id,label,icon]) => <button key={id} type="button" onClick={() => setSpicy(id as any)} className={`p-2 rounded-2xl border text-xs font-bold ${spicy === id ? 'bg-red-50 border-red-500 text-red-700' : 'bg-[#F7F5F0] border-[#F0EDE8]'}`}>{icon}<br />{label}</button>)}</div></div>
        <textarea rows={2} value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} placeholder="Instructions spéciales..." className="w-full p-3 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs outline-none resize-none" />
      </div>
      <div className="p-4 border-t border-[#F0EDE8] flex items-center gap-4 shrink-0"><div className="flex items-center bg-[#F7F5F0] rounded-2xl p-1"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-xl bg-white flex items-center justify-center"><Minus className="w-4 h-4" /></button><span className="w-9 text-center font-black">{quantity}</span><button type="button" onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-xl bg-white flex items-center justify-center"><Plus className="w-4 h-4" /></button></div><div className="flex-1"><Primary3DButton id="btn-modal-add-to-cart" onClick={add} size="md" icon={<ShoppingBag className="w-4 h-4" />}>{t('addToCart')} • {totalPrice.toLocaleString()} FCFA</Primary3DButton></div></div>
    </motion.div>
  </div>;
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => product ? <ProductDetailContent product={product} onClose={onClose} /> : null;
