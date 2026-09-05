import crypto from 'crypto';

const PAYMENT_METHODS = new Set(['wave', 'orange_money', 'mtn', 'cash_on_delivery']);
const DELIVERY_ZONES = new Map([
  ['Dakar Plateau', { fee: 500, time: '20–30 min' }], ['Les Almadies', { fee: 700, time: '25–35 min' }], ['Ngor & Île de Ngor', { fee: 700, time: '25–40 min' }],
  ['Ouakam & Monument de la Renaissance', { fee: 500, time: '20–35 min' }], ['Mermoz / Sacré-Cœur', { fee: 500, time: '20–30 min' }],
  ['Fann Résidence / Point E', { fee: 500, time: '15–25 min' }], ['Yoff & Tonghor', { fee: 600, time: '25–35 min' }],
  ['Sicap Liberté (1 à 6)', { fee: 500, time: '20–30 min' }], ['Parcelles Assainies', { fee: 800, time: '30–45 min' }], ['Hann Maristes', { fee: 700, time: '25–40 min' }],
]);
const cleanText = (value, max = 500) => String(value ?? '').trim().slice(0, max);
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPhone = value => { const digits = String(value || '').replace(/\D/g, ''); return digits.length >= 8 && digits.length <= 15; };
const validIdempotencyKey = value => /^[A-Za-z0-9._:-]{16,160}$/.test(String(value || ''));

const normalizeAddress = (address, customer) => {
  const a = address && typeof address === 'object' ? address : {}; const lat = Number(a.lat); const lng = Number(a.lng);
  return { fullName: cleanText(a.fullName || customer.name, 120), phone: cleanText(a.phone || customer.phone, 40), email: cleanText(a.email || customer.email, 160) || undefined,
    neighborhood: cleanText(a.neighborhood, 160), streetAddress: cleanText(a.streetAddress, 300), buildingInfo: cleanText(a.buildingInfo, 300) || undefined, instructions: cleanText(a.instructions, 500) || undefined,
    ...(Number.isFinite(lat) && lat >= -90 && lat <= 90 ? { lat } : {}), ...(Number.isFinite(lng) && lng >= -180 && lng <= 180 ? { lng } : {}) };
};

const canonicalizeOptions = (product, selected) => {
  const groups = Array.isArray(product.options) ? product.options : []; const selections = Array.isArray(selected) ? selected : []; const selectedByGroup = new Map(); const canonical = [];
  for (const option of selections) {
    const group = groups.find(g => g?.id === option?.groupId); const choice = group?.choices?.find(c => c?.id === option?.choiceId);
    if (!group || !choice) return { valid: false, options: [], price: 0 };
    const count = (selectedByGroup.get(group.id) || 0) + 1; if (count > Math.max(1, Number(group.maxSelections) || 1)) return { valid: false, options: [], price: 0 };
    selectedByGroup.set(group.id, count); canonical.push({ groupId: group.id, groupName: cleanText(group.nameFR || group.nameEN, 120), choiceId: choice.id, choiceName: cleanText(choice.nameFR || choice.nameEN, 160), price: Math.max(0, Math.round(Number(choice.price) || 0)) });
  }
  for (const group of groups) if (group?.required && !selectedByGroup.has(group.id)) return { valid: false, options: [], price: 0 };
  return { valid: true, options: canonical, price: canonical.reduce((sum, option) => sum + option.price, 0) };
};

const productSnapshot = product => ({
  id: product.id, restaurantId: product.restaurant_id, restaurantName: product.restaurant_name, categoryId: product.category_id,
  nameFR: product.name_fr || product.name || '', nameEN: product.name_en || product.name || '', descriptionFR: product.description_fr || product.description || '', descriptionEN: product.description_en || product.description || '',
  imageUrl: product.image_url || '', price: Math.max(0, Math.round(Number(product.price) || 0)), originalPrice: product.original_price == null ? undefined : Math.round(Number(product.original_price) || 0),
  available: product.available !== false, rating: Number(product.rating) || 0, reviewCount: Number(product.review_count) || 0, prepTimeMinutes: Number(product.prep_time_minutes) || 20,
  isSpicy: Boolean(product.is_spicy), isPopular: Boolean(product.is_popular), isSignature: Boolean(product.is_signature), ingredientsFR: Array.isArray(product.ingredients_fr) ? product.ingredients_fr : [], ingredientsEN: Array.isArray(product.ingredients_en) ? product.ingredients_en : [], options: Array.isArray(product.options) ? product.options : [], createdAt: product.created_at || new Date().toISOString()
});
const publicOrder = row => ({ id: row.id, userId: row.user_id, customerName: row.customer_name, customerPhone: row.customer_phone, customerEmail: row.customer_email || row.delivery_address?.email || '', restaurantId: row.restaurant_id, restaurantName: row.restaurant_name, restaurantLogo: row.restaurant_logo, restaurantPhone: row.restaurant_phone, restaurantAddress: row.restaurant_address, driver: row.driver || undefined, items: Array.isArray(row.items) ? row.items : [], subtotal: Number(row.subtotal) || 0, deliveryFee: Number(row.delivery_fee) || 0, discount: Number(row.discount) || 0, promoCode: row.promo_code || undefined, total: Number(row.total) || 0, paymentMethod: row.payment_method, paymentStatus: row.payment_status, orderStatus: row.order_status, deliveryAddress: row.delivery_address || {}, estimatedDeliveryTime: row.estimated_delivery_time, deliveredAt: row.delivered_at, createdAt: row.created_at, statusHistory: Array.isArray(row.status_history) ? row.status_history : [] });

export const registerOrderRoutes = (app, { supabase, notifyWhatsApp }) => {
  app.post('/api/orders', async (req, res) => {
    if (!supabase) return res.status(503).json({ ok: false, error: 'Supabase server credentials are not configured.' });
    try {
      const payload = req.body && typeof req.body === 'object' ? req.body : {}; const customer = payload.customer && typeof payload.customer === 'object' ? payload.customer : {};
      const name = cleanText(customer.name, 120), phone = cleanText(customer.phone, 40), email = cleanText(customer.email, 160), restaurantId = cleanText(payload.restaurantId, 120), paymentMethod = cleanText(payload.paymentMethod, 40);
      const clientItems = Array.isArray(payload.items) ? payload.items.slice(0, 50) : []; const idempotencyKey = cleanText(req.headers['x-idempotency-key'] || payload.idempotencyKey, 160);
      if (!name || !validPhone(phone) || !validEmail(email) || !restaurantId || !clientItems.length || !PAYMENT_METHODS.has(paymentMethod)) return res.status(400).json({ ok: false, error: 'Complete and valid customer, restaurant, items and payment information are required.' });
      if (!validIdempotencyKey(idempotencyKey)) return res.status(400).json({ ok: false, error: 'A valid idempotency key is required.' });

      const { data: existingOrder, error: existingError } = await supabase.from('orders').select('*').eq('idempotency_key', idempotencyKey).maybeSingle();
      if (existingError) { console.error('Order idempotency lookup failed:', existingError); return res.status(500).json({ ok: false, error: 'Order system is not fully migrated. Run the production hardening migration.' }); }
      if (existingOrder) {
        const notificationSent = typeof notifyWhatsApp === 'function' ? await notifyWhatsApp(existingOrder, 'new_order') : false;
        return res.status(200).json({ ok: true, duplicate: true, notificationSent, order: publicOrder(existingOrder) });
      }

      const { data: restaurant, error: restaurantError } = await supabase.from('restaurants').select('id,name,logo_url,phone,address,estimated_delivery_time,is_open').eq('id', restaurantId).single();
      if (restaurantError || !restaurant) return res.status(400).json({ ok: false, error: 'Restaurant is not available.' });
      if (restaurant.is_open === false) return res.status(409).json({ ok: false, error: 'This restaurant is currently closed.' });

      const address = normalizeAddress(payload.deliveryAddress, { name, phone, email });
      if (!address.streetAddress || !address.neighborhood) return res.status(400).json({ ok: false, error: 'Delivery address is required.' });
      const zone = DELIVERY_ZONES.get(address.neighborhood); if (!zone) return res.status(400).json({ ok: false, error: 'This delivery neighborhood is not supported.' });

      const productIds = [...new Set(clientItems.map(item => cleanText(item?.productId, 120)).filter(Boolean))];
      if (!productIds.length || productIds.length > 50) return res.status(400).json({ ok: false, error: 'Order contains invalid products.' });
      const { data: products, error: productError } = await supabase.from('products').select('*').in('id', productIds);
      if (productError) return res.status(500).json({ ok: false, error: 'Unable to validate order products.' });
      const productMap = new Map((products || []).map(p => [p.id, p])); const sanitizedItems = []; let subtotal = 0;
      for (const item of clientItems) {
        const productId = cleanText(item?.productId, 120), product = productMap.get(productId), quantity = Number(item?.quantity);
        if (!product || product.restaurant_id !== restaurantId || product.available === false || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) return res.status(400).json({ ok: false, error: 'One or more products are unavailable or invalid.' });
        const optionResult = canonicalizeOptions(product, item?.selectedOptions); if (!optionResult.valid) return res.status(400).json({ ok: false, error: 'One or more product options are invalid or incomplete.' });
        const snapshot = productSnapshot(product), unitPrice = snapshot.price + optionResult.price, totalPrice = unitPrice * quantity; subtotal += totalPrice;
        sanitizedItems.push({ id: cleanText(item?.id, 160) || `item-${crypto.randomUUID()}`, productId, product: snapshot, restaurantId, restaurantName: restaurant.name, quantity, selectedOptions: optionResult.options, specialInstructions: cleanText(item?.specialInstructions, 500) || undefined, unitPrice, totalPrice });
      }

      let discount = 0, promoCode = null; const requestedPromo = cleanText(payload.promoCode, 80).toUpperCase();
      if (requestedPromo) {
        const { data: promo } = await supabase.from('promotions').select('*').eq('code', requestedPromo).eq('is_active', true).single();
        if (promo && (!promo.valid_until || new Date(promo.valid_until).getTime() >= Date.now()) && subtotal >= Number(promo.min_order_value || 0)) {
          promoCode = promo.code; discount = promo.discount_type === 'fixed' ? Math.min(subtotal, Math.round(Number(promo.discount_value) || 0)) : Math.min(subtotal, Math.round(subtotal * (Number(promo.discount_value) || 0) / 100));
        }
      }
      const deliveryFee = zone.fee, total = Math.max(0, subtotal + deliveryFee - discount), now = new Date().toISOString();
      const orderId = `TE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const row = { id: orderId, idempotency_key: idempotencyKey, user_id: cleanText(payload.userId, 160) || `guest-${crypto.randomUUID()}`, customer_name: name, customer_phone: phone, customer_email: email, restaurant_id: restaurantId, restaurant_name: restaurant.name, restaurant_logo: restaurant.logo_url || '', restaurant_phone: restaurant.phone || '', restaurant_address: restaurant.address || '', driver: null, items: sanitizedItems, subtotal, delivery_fee: deliveryFee, discount, promo_code: promoCode, total, payment_method: paymentMethod, payment_status: paymentMethod === 'cash_on_delivery' ? 'cash_pending' : 'pending', order_status: 'pending', delivery_address: address, status_history: [{ status: 'pending', timestamp: now, noteFR: 'Commande reçue et transmise.', noteEN: 'Order received and submitted.' }], created_at: now, estimated_delivery_time: zone.time || restaurant.estimated_delivery_time || '25–35 min' };
      const { data: saved, error: insertError } = await supabase.from('orders').insert(row).select('*').single();
      if (insertError || !saved) {
        if (insertError?.code === '23505') { const { data: concurrent } = await supabase.from('orders').select('*').eq('idempotency_key', idempotencyKey).maybeSingle(); if (concurrent) { const notificationSent = typeof notifyWhatsApp === 'function' ? await notifyWhatsApp(concurrent, 'new_order') : false; return res.status(200).json({ ok: true, duplicate: true, notificationSent, order: publicOrder(concurrent) }); } }
        console.error('Production order insert failed:', insertError); return res.status(500).json({ ok: false, error: 'Unable to save the order.' });
      }
      const notificationSent = typeof notifyWhatsApp === 'function' ? await notifyWhatsApp(saved, 'new_order') : false;
      res.status(201).json({ ok: true, order: publicOrder(saved), notificationSent });
    } catch (error) { console.error('Production order API failed:', error); res.status(500).json({ ok: false, error: 'Unable to create the order.' }); }
  });
};
