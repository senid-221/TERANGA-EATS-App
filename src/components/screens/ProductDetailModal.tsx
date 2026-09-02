import React, { useState, useMemo } from 'react';
import { Product, SelectedOption } from '../../types';
import { useApp } from '../../context/AppContext';
import { Primary3DButton } from '../common/Primary3DButton';
import {
  Check,
  Clock,
  Flame,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
}) => {
  const { t, language, addToCart } = useApp();

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedSpicyLevel, setSelectedSpicyLevel] = useState<'mild' | 'medium' | 'spicy'>('medium');
  const [extraDrinkId, setExtraDrinkId] = useState<string | null>(null);

  // Extra Dakar drinks add-on
  const extraDrinksList = [
    { id: 'bissap-add', nameFR: 'Jus de Bissap Rouge Frais (50cl)', nameEN: 'Fresh Hibiscus Bissap Juice', price: 1000 },
    { id: 'bouye-add', nameFR: 'Jus de Bouye Baobab Onctueux (50cl)', nameEN: 'Creamy Baobab Juice', price: 1200 },
    { id: 'touba-add', nameFR: 'Café Touba Épicé Chaud', nameEN: 'Hot Spiced Café Touba', price: 600 },
  ];

  if (!product) return null;

  const name = language === 'fr' ? product.nameFR : product.nameEN;
  const desc = language === 'fr' ? product.descriptionFR : product.descriptionEN;
  const ingredients = language === 'fr' ? product.ingredientsFR : product.ingredientsEN;

  // Option selection handler
  const handleOptionToggle = (
    groupId: string,
    groupName: string,
    choiceId: string,
    choiceName: string,
    price: number,
    isRadio: boolean
  ) => {
    if (isRadio) {
      setSelectedOptions((prev) => [
        ...prev.filter((o) => o.groupId !== groupId),
        { groupId, groupName, choiceId, choiceName, price },
      ]);
    } else {
      setSelectedOptions((prev) => {
        const exists = prev.some((o) => o.groupId === groupId && o.choiceId === choiceId);
        if (exists) {
          return prev.filter((o) => !(o.groupId === groupId && o.choiceId === choiceId));
        }
        return [...prev, { groupId, groupName, choiceId, choiceName, price }];
      });
    }
  };

  // Calculate Unit Price with options
  const unitPrice = useMemo(() => {
    let price = product.price;
    selectedOptions.forEach((opt) => {
      price += opt.price;
    });
    if (extraDrinkId) {
      const drink = extraDrinksList.find((d) => d.id === extraDrinkId);
      if (drink) price += drink.price;
    }
    return price;
  }, [product, selectedOptions, extraDrinkId]);

  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addToCart({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      product,
      restaurantId: product.restaurantId,
      restaurantName: product.restaurantName,
      quantity,
      selectedOptions: [
        ...selectedOptions,
        ...(extraDrinkId
          ? [
              {
                groupId: 'drinks',
                groupName: 'Boisson',
                choiceId: extraDrinkId,
                choiceName: extraDrinksList.find((d) => d.id === extraDrinkId)?.nameFR || '',
                price: extraDrinksList.find((d) => d.id === extraDrinkId)?.price || 0,
              },
            ]
          : []),
      ],
      specialInstructions: `${specialInstructions} [Piment: ${selectedSpicyLevel}]`.trim(),
      unitPrice,
      totalPrice,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-lg rounded-[36px] shadow-artistic-lg overflow-hidden border border-[#F0EDE8] my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Top Header Image */}
        <div className="relative h-56 sm:h-64 w-full bg-gray-100 shrink-0">
          <img
            src={product.imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-[#2D2D2D] flex items-center justify-center shadow-md hover:bg-white cursor-pointer active:scale-90 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Restaurant & Tags */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FFCC00] bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-xs border border-white/10">
              {product.restaurantName}
            </span>
            <h3 className="font-heading text-xl sm:text-2xl font-black text-white leading-tight mt-1.5 drop-shadow-sm">
              {name}
            </h3>
          </div>
        </div>

        {/* Scrollable Customization Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1 bg-white">
          {/* Price, Rating, Prep Time */}
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EDE8]">
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-[#006633]">
                {product.price.toLocaleString()} FCFA
              </span>
              {product.originalPrice && (
                <span className="text-xs text-gray-400 line-through ml-2">
                  {product.originalPrice.toLocaleString()} FCFA
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 font-semibold">
              <div className="flex items-center gap-1 text-[#FFCC00] font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                <Star className="w-4 h-4 fill-[#FFCC00] text-[#FFCC00]" />
                <span className="text-amber-950">{product.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>~{product.prepTimeMinutes} min</span>
              </div>
            </div>
          </div>

          {/* Description & Ingredients */}
          <div>
            <h4 className="text-xs font-black text-[#2D2D2D] uppercase tracking-wide mb-1">
              Description
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">{desc}</p>

            {ingredients && ingredients.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-black text-[#2D2D2D] uppercase tracking-wide mb-1.5">
                  {t('ingredients')}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {ingredients.map((ing, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-xl bg-[#F7F5F0] border border-[#F0EDE8] text-gray-700 text-[11px] font-bold"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Options from Data (e.g. Size, Sauces) */}
          {product.options &&
            product.options.map((grp) => (
              <div key={grp.id} className="space-y-2 pt-2 border-t border-[#F0EDE8]">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#2D2D2D] uppercase">
                    {language === 'fr' ? grp.nameFR : grp.nameEN}
                  </h4>
                  {grp.required && (
                    <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      Obligatoire
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {grp.choices.map((choice) => {
                    const isSelected = selectedOptions.some(
                      (o) => o.groupId === grp.id && o.choiceId === choice.id
                    );
                    const choiceName = language === 'fr' ? choice.nameFR : choice.nameEN;

                    return (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() =>
                          handleOptionToggle(
                            grp.id,
                            grp.nameFR,
                            choice.id,
                            choice.nameFR,
                            choice.price,
                            grp.maxSelections === 1
                          )
                        }
                        className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-[#006633] text-[#006633]'
                            : 'bg-[#F7F5F0] border-[#F0EDE8] text-[#2D2D2D] hover:bg-[#F0EDE8]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'bg-[#006633] border-[#006633]' : 'border-gray-400 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                          <span>{choiceName}</span>
                        </div>
                        {choice.price > 0 && (
                          <span className="font-black text-[#006633]">
                            +{choice.price} FCFA
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* Spiciness Level (Dakar style) */}
          <div className="space-y-2 pt-2 border-t border-[#F0EDE8]">
            <h4 className="font-bold text-xs text-[#2D2D2D] uppercase flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#E8702A]" />
              {t('spicyLevel')}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'mild', label: 'Doux', icon: '🌿' },
                { id: 'medium', label: 'Moyen', icon: '🌶️' },
                { id: 'spicy', label: 'Pimenté 🔥', icon: '🔥' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedSpicyLevel(lvl.id as any)}
                  className={`py-2.5 px-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    selectedSpicyLevel === lvl.id
                      ? 'bg-red-50 border-red-500 text-red-700 shadow-2xs'
                      : 'bg-[#F7F5F0] border-[#F0EDE8] text-gray-600'
                  }`}
                >
                  <div className="text-base mb-0.5">{lvl.icon}</div>
                  <span>{lvl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Extra Local Drink Upsell */}
          <div className="space-y-2 pt-2 border-t border-[#F0EDE8]">
            <h4 className="font-bold text-xs text-[#2D2D2D] uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#FFCC00]" />
              {t('extraDrinks')}
            </h4>
            <div className="space-y-1.5">
              {extraDrinksList.map((drink) => {
                const isSelected = extraDrinkId === drink.id;
                return (
                  <button
                    key={drink.id}
                    type="button"
                    onClick={() => setExtraDrinkId(isSelected ? null : drink.id)}
                    className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50 border-[#FFCC00] text-amber-950'
                        : 'bg-[#F7F5F0] border-[#F0EDE8] text-gray-700 hover:bg-[#F0EDE8]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'bg-[#FFCC00] border-[#FFCC00]' : 'border-gray-400 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-amber-950 stroke-[3]" />}
                      </div>
                      <span>{language === 'fr' ? drink.nameFR : drink.nameEN}</span>
                    </div>
                    <span className="font-black text-[#006633]">+{drink.price} FCFA</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="pt-2 border-t border-[#F0EDE8]">
            <label className="block text-xs font-bold text-[#2D2D2D] uppercase mb-1">
              Instructions spéciales
            </label>
            <textarea
              rows={2}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Ex: Sauce d'oignons bien cuite, piment séparé..."
              className="w-full p-3 rounded-2xl bg-[#F7F5F0] border border-[#F0EDE8] text-xs font-medium text-[#2D2D2D] focus:bg-white focus:border-[#006633] outline-none resize-none"
            />
          </div>
        </div>

        {/* Modal Bottom Sticky Actions */}
        <div className="p-4 bg-white border-t border-[#F0EDE8] flex items-center justify-between gap-4 shadow-artistic shrink-0">
          {/* Quantity selector */}
          <div className="flex items-center bg-[#F7F5F0] rounded-2xl p-1 border border-[#F0EDE8]">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-xl bg-white text-[#2D2D2D] flex items-center justify-center shadow-xs hover:bg-gray-50 cursor-pointer font-bold"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-9 text-center font-black text-sm text-[#2D2D2D]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-xl bg-white text-[#2D2D2D] flex items-center justify-center shadow-xs hover:bg-gray-50 cursor-pointer font-bold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to cart 3D button with dynamic price */}
          <div className="flex-1">
            <Primary3DButton
              id="btn-modal-add-to-cart"
              onClick={handleAddToCart}
              size="md"
              icon={<ShoppingBag className="w-4 h-4" />}
            >
              {t('addToCart')} • {totalPrice.toLocaleString()} FCFA
            </Primary3DButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
